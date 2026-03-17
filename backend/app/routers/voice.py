import json
import asyncio
import base64
import logging
import numpy as np
import torch
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import websockets
from app.config import settings
from app.prompts import REALTIME_VOICE_INSTRUCTIONS
from app.rag import search, check_relevance

logger = logging.getLogger(__name__)

router = APIRouter(tags=["voice"])

OPENAI_REALTIME_URL = f"wss://api.openai.com/v1/realtime?model={settings.realtime_model}"

# Load Silero VAD model once at startup
silero_model, silero_utils = torch.hub.load(
    repo_or_dir='snakers4/silero-vad', model='silero_vad', force_reload=False
)
(get_speech_timestamps, _, _, _, _) = silero_utils

SEARCH_KB_TOOL = {
    "type": "function",
    "name": "search_kb",
    "description": "Hüquqi sənəd bazasında axtarış. Yalnız hüquqi suallar üçün istifadə et.",
    "parameters": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Formal hüquqi dildə axtarış sorğusu",
            }
        },
        "required": ["query"],
    },
}

SESSION_CONFIG = {
    "type": "session.update",
    "session": {
        "instructions": REALTIME_VOICE_INSTRUCTIONS,
        "tools": [SEARCH_KB_TOOL],
        "tool_choice": "auto",
        "voice": "ash",
        "input_audio_format": "pcm16",
        "output_audio_format": "pcm16",
        "input_audio_transcription": {
            "model": "gpt-4o-transcribe",
            "language": "az",
        },
        "turn_detection": {
            "type": "semantic_vad",
            "eagerness": "low",
            "interrupt_response": False,
            "create_response": True,
        },
    },
}


def is_speech(audio_bytes: bytes) -> bool:
    """Check if audio chunk contains human speech using Silero VAD."""
    try:
        int16 = np.frombuffer(audio_bytes, dtype=np.int16)
        float32 = int16.astype(np.float32) / 32768.0
        tensor = torch.from_numpy(float32)

        # Silero expects 16kHz, our audio is 24kHz — resample
        # Simple downsample: take every 1.5th sample
        target_len = int(len(tensor) * 16000 / 24000)
        indices = torch.linspace(0, len(tensor) - 1, target_len).long()
        resampled = tensor[indices]

        confidence = silero_model(resampled, 16000).item()
        return confidence > 0.5
    except Exception:
        return False


def handle_function_call(name: str, arguments: str) -> str:
    """Execute function call from Realtime API and return result."""
    if name != "search_kb":
        return json.dumps({"error": "Unknown function"})

    try:
        args = json.loads(arguments)
        query = args.get("query", "")
        logger.info(f"Voice search_kb: '{query}'")

        result = search(query)
        matches = result["matches"]
        distances = result["distances"]

        THRESHOLD = 1.2
        if matches and distances:
            filtered = [
                (m, d) for m, d in zip(matches, distances)
                if d <= THRESHOLD
            ]
            matches = [m for m, d in filtered]

        if not matches:
            return "Bu suala məlumat bazasında cavab tapılmadı."

        context = "\n\n".join([m["text"] for m in matches])

        if not check_relevance(query, context):
            return "Bu suala məlumat bazasında cavab tapılmadı."

        return context

    except Exception as e:
        logger.error(f"search_kb error: {e}")
        return "Axtarış zamanı xəta baş verdi."


@router.websocket("/api/voice")
async def voice_endpoint(ws: WebSocket):
    """WebSocket proxy between frontend and OpenAI Realtime API."""
    await ws.accept()

    headers = {
        "Authorization": f"Bearer {settings.openai_api_key}",
        "OpenAI-Beta": "realtime=v1",
    }

    # Track whether AI is currently speaking
    ai_speaking = asyncio.Event()
    speech_streak = 0  # consecutive speech chunks detected
    SPEECH_STREAK_THRESHOLD = 3  # need 3+ consecutive speech chunks to interrupt

    try:
        async with websockets.connect(
            OPENAI_REALTIME_URL,
            additional_headers=headers,
            open_timeout=10,
            close_timeout=5,
            ping_interval=20,
            ping_timeout=10,
        ) as openai_ws:

            await asyncio.wait_for(openai_ws.send(json.dumps(SESSION_CONFIG)), timeout=5)

            async def forward_to_openai():
                """Frontend → OpenAI (with Silero VAD gating during AI speech)"""
                try:
                    while True:
                        data = await ws.receive_text()
                        event = json.loads(data)

                        # If this is audio and AI is speaking, check with Silero first
                        if event.get("type") == "input_audio_buffer.append" and ai_speaking.is_set():
                            audio_b64 = event.get("audio", "")
                            audio_bytes = base64.b64decode(audio_b64)

                            speech_detected = await asyncio.to_thread(is_speech, audio_bytes)

                            if speech_detected:
                                nonlocal speech_streak
                                speech_streak += 1
                                if speech_streak >= SPEECH_STREAK_THRESHOLD:
                                    logger.info("Silero: sustained speech detected — interrupting")
                                    await openai_ws.send(json.dumps({"type": "response.cancel"}))
                                    ai_speaking.clear()
                                    speech_streak = 0
                                    await openai_ws.send(data)
                            else:
                                speech_streak = 0
                        else:
                            await openai_ws.send(data)

                except WebSocketDisconnect:
                    pass

            async def forward_to_frontend():
                """OpenAI → Frontend (with function call handling)"""
                function_call_name = None
                function_call_args = ""
                call_id = None

                try:
                    async for message in openai_ws:
                        event = json.loads(message)
                        event_type = event.get("type", "")

                        # Track AI speaking state
                        if event_type == "response.audio.delta":
                            ai_speaking.set()
                        elif event_type in ("response.audio.done", "response.done"):
                            ai_speaking.clear()

                        if event_type == "response.function_call_arguments.delta":
                            function_call_args += event.get("delta", "")
                            continue

                        if event_type == "response.function_call_arguments.done":
                            function_call_name = event.get("name", "")
                            call_id = event.get("call_id", "")
                            function_call_args = event.get("arguments", function_call_args)

                            result = await asyncio.to_thread(
                                handle_function_call, function_call_name, function_call_args
                            )

                            await openai_ws.send(json.dumps({
                                "type": "conversation.item.create",
                                "item": {
                                    "type": "function_call_output",
                                    "call_id": call_id,
                                    "output": result,
                                },
                            }))

                            await openai_ws.send(json.dumps({
                                "type": "response.create",
                            }))

                            function_call_name = None
                            function_call_args = ""
                            call_id = None
                            continue

                        await ws.send_text(message)

                except websockets.exceptions.ConnectionClosed:
                    pass

            tasks = [
                asyncio.create_task(forward_to_openai()),
                asyncio.create_task(forward_to_frontend()),
            ]
            try:
                done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
                for task in pending:
                    task.cancel()
            except Exception:
                for task in tasks:
                    task.cancel()

    except asyncio.TimeoutError:
        logger.error("Voice WebSocket: OpenAI connection timed out")
    except Exception as e:
        logger.error(f"Voice WebSocket error: {e}")
    finally:
        try:
            await ws.close()
        except:
            pass
