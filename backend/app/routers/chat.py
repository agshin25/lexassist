from fastapi import APIRouter, UploadFile, File, Depends, Request, BackgroundTasks, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.rag import ask, ask_stream, ingest_pdf, delete_document, get_or_create_collection
from app.config import settings
from app.prompts import STT_PROMPT
from app.database import get_db, SessionLocal
from app.models import Conversation, Message
import os
import shutil
import json
import threading

# Track processing status: filename -> {"status": "processing"/"ready"/"error", "chunks": 0}
_upload_status = {}
_upload_lock = threading.Lock()

router = APIRouter(prefix="/api", tags=["chat"])


class ChatRequest(BaseModel):
    message: str
    conversation_id: str | None = None


class ChatResponse(BaseModel):
    answer: str
    sources: list[str]
    conversation_id: str


class IngestResponse(BaseModel):
    filename: str
    chunks: int
    message: str


@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest, db: Session = Depends(get_db)):
    if request.conversation_id:
        conv = db.query(Conversation).filter(Conversation.id == request.conversation_id).first()
        if not conv:
            conv = Conversation(title=request.message[:40])
            db.add(conv)
            db.commit()
            db.refresh(conv)
    else:
        conv = Conversation(title=request.message[:40])
        db.add(conv)
        db.commit()
        db.refresh(conv)

    if conv.title == "Yeni söhbət":
        conv.title = request.message[:40]
        db.commit()

    user_msg = Message(conversation_id=conv.id, role="user", content=request.message)
    db.add(user_msg)
    db.commit()

    recent_messages = (
        db.query(Message)
        .filter(Message.conversation_id == conv.id)
        .order_by(Message.created_at.asc())
        .all()
    )

    history = [
        {"role": msg.role, "content": msg.content}
        for msg in recent_messages[:-1]
    ]

    result = ask(request.message, history=history)

    ai_msg = Message(
        conversation_id=conv.id,
        role="assistant",
        content=result["answer"],
        sources=json.dumps(result["sources"]),
    )
    db.add(ai_msg)
    db.commit()

    return ChatResponse(
        answer=result["answer"],
        sources=result["sources"],
        conversation_id=conv.id,
    )


@router.post("/chat/stream")
def chat_stream(request: ChatRequest, db: Session = Depends(get_db)):
    if request.conversation_id:
        conv = db.query(Conversation).filter(Conversation.id == request.conversation_id).first()
        if not conv:
            conv = Conversation(title=request.message[:40])
            db.add(conv)
            db.commit()
            db.refresh(conv)
    else:
        conv = Conversation(title=request.message[:40])
        db.add(conv)
        db.commit()
        db.refresh(conv)

    if conv.title == "Yeni söhbət":
        conv.title = request.message[:40]
        db.commit()

    user_msg = Message(conversation_id=conv.id, role="user", content=request.message)
    db.add(user_msg)
    db.commit()

    recent_messages = (
        db.query(Message)
        .filter(Message.conversation_id == conv.id)
        .order_by(Message.created_at.asc())
        .all()
    )
    history = [
        {"role": msg.role, "content": msg.content}
        for msg in recent_messages[:-1]
    ]

    conversation_id = conv.id

    def event_generator():
        yield f"event: meta\ndata: {json.dumps({'conversation_id': conversation_id})}\n\n"

        full_text = ""
        sources = []

        for event_type, data in ask_stream(request.message, history=history):
            if event_type == "sources":
                sources = json.loads(data).get("sources", [])
                yield f"event: sources\ndata: {data}\n\n"
            elif event_type == "token":
                full_text += data
                yield f"event: token\ndata: {json.dumps({'token': data})}\n\n"
            elif event_type == "done":
                yield f"event: done\ndata: {data}\n\n"

        db_session = SessionLocal()
        try:
            ai_msg = Message(
                conversation_id=conversation_id,
                role="assistant",
                content=full_text,
                sources=json.dumps(sources),
            )
            db_session.add(ai_msg)
            db_session.commit()
        finally:
            db_session.close()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


def _process_pdf(file_path: str, filename: str):
    """Background worker — ingests PDF and updates status."""
    try:
        chunks_count = ingest_pdf(file_path)
        with _upload_lock:
            _upload_status[filename] = {"status": "ready", "chunks": chunks_count}
    except Exception as e:
        with _upload_lock:
            _upload_status[filename] = {"status": "error", "message": str(e)}


@router.post("/upload")
def upload_pdf(file: UploadFile = File(...)):
    os.makedirs(settings.pdf_path, exist_ok=True)
    file_path = os.path.join(settings.pdf_path, file.filename)

    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    with _upload_lock:
        _upload_status[file.filename] = {"status": "processing", "chunks": 0}

    thread = threading.Thread(target=_process_pdf, args=(file_path, file.filename))
    thread.start()

    return {"filename": file.filename, "status": "processing", "message": "Sənəd emal olunur..."}


@router.get("/documents")
def list_documents():
    pdf_dir = settings.pdf_path
    if not os.path.exists(pdf_dir):
        return {"documents": []}

    collection = get_or_create_collection()
    all_data = collection.get()

    chunk_counts = {}
    for meta in all_data['metadatas']:
        if meta is None:
            continue
        src = meta.get('source', '')
        chunk_counts[src] = chunk_counts.get(src, 0) + 1

    files = []
    for filename in os.listdir(pdf_dir):
        if filename.endswith(".pdf"):
            filepath = os.path.join(pdf_dir, filename)
            chunks = chunk_counts.get(filename, 0)

            with _upload_lock:
                status_info = _upload_status.get(filename)

            if status_info and status_info["status"] == "processing":
                status = "processing"
            elif status_info and status_info["status"] == "error":
                status = "error"
            else:
                status = "ready" if chunks > 0 else "ready"

            files.append({
                "filename": filename,
                "size_mb": round(os.path.getsize(filepath) / 1024 / 1024, 2),
                "chunks": chunks,
                "uploaded_at": os.path.getmtime(filepath),
                "status": status,
            })

    return {"documents": files}


@router.delete("/documents/{filename}")
def remove_document(filename: str):
    pdf_dir = settings.pdf_path
    filepath = os.path.join(pdf_dir, filename)

    deleted_chunks = delete_document(filename)

    if os.path.exists(filepath):
        os.remove(filepath)

    return {"message": f"{filename} deleted", "chunks_removed": deleted_chunks}

@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """Transcribe audio using OpenAI Whisper API."""
    from openai import OpenAI

    client = OpenAI(api_key=settings.openai_api_key)
    audio_bytes = await file.read()

    transcription = client.audio.transcriptions.create(
        model="gpt-4o-transcribe",
        file=(file.filename or "recording.webm", audio_bytes),
        language="az",
        prompt=STT_PROMPT,
    )

    return {"text": transcription.text}
