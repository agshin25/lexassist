import { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { API_BASE_URL } from '../../services/api';

const WS_URL = API_BASE_URL.replace('http', 'ws') + '/api/voice';

export default function VoiceMode({ onClose }) {
  const [status, setStatus] = useState('connecting');
  const [userTranscript, setUserTranscript] = useState('');
  const [aiTranscript, setAiTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);

  const wsRef = useRef(null);
  const statusRef = useRef('connecting');
  const micCtxRef = useRef(null);
  const playCtxRef = useRef(null);
  const streamRef = useRef(null);
  const processorRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const nextPlayTimeRef = useRef(0);

  // Play PCM16 audio chunk (24kHz from OpenAI)
  const playAudioChunk = useCallback((base64Audio) => {
    const ctx = playCtxRef.current;
    if (!ctx) return;

    // Resume if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') ctx.resume();

    // Decode base64 to bytes
    const binaryStr = atob(base64Audio);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

    // Convert Int16 PCM to Float32
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768;

    // Create audio buffer at 24kHz (OpenAI's output rate)
    const buffer = ctx.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    // Schedule playback seamlessly
    const now = ctx.currentTime;
    const startTime = Math.max(now + 0.01, nextPlayTimeRef.current);
    source.start(startTime);
    nextPlayTimeRef.current = startTime + buffer.duration;
  }, []);

  // Handle WebSocket messages from backend
  const handleMessage = useCallback((event) => {
    let data;
    try {
      data = JSON.parse(event.data);
    } catch {
      return;
    }
    const type = data.type || '';

    switch (type) {
      case 'session.created':
      case 'session.updated':
        statusRef.current = 'listening';
        setStatus('listening');
        break;

      case 'input_audio_buffer.speech_started':
        statusRef.current = 'listening';
        setStatus('listening');
        setUserTranscript('');
        setAiTranscript('');
        nextPlayTimeRef.current = 0;
        break;

      case 'input_audio_buffer.speech_stopped':
        statusRef.current = 'thinking';
        setStatus('thinking');
        break;

      case 'conversation.item.input_audio_transcription.completed':
        setUserTranscript(data.transcript || '');
        break;

      case 'response.audio.delta':
        statusRef.current = 'speaking';
        setStatus('speaking');
        if (data.delta) playAudioChunk(data.delta);
        break;

      case 'response.audio.done':
        setTimeout(() => {
          statusRef.current = 'listening';
          setStatus('listening');
        }, 500);
        break;

      case 'response.audio_transcript.delta':
        setAiTranscript((prev) => prev + (data.delta || ''));
        break;

      case 'error':
        console.error('Realtime API error:', data);
        break;

      default:
        break;
    }
  }, [playAudioChunk]);

  // Monitor mic level for orb visualization
  const monitorAudioLevel = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const update = () => {
      animFrameRef.current = requestAnimationFrame(update);
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
      setAudioLevel(sum / dataArray.length / 255);
    };
    update();
  }, []);

  // Start mic and WebSocket
  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      // Separate AudioContext for playback (default sample rate for best compatibility)
      const playCtx = new AudioContext();
      playCtxRef.current = playCtx;
      await playCtx.resume();

      // AudioContext for mic recording
      const micCtx = new AudioContext({ sampleRate: 24000 });
      micCtxRef.current = micCtx;
      await micCtx.resume();

      // Mic stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
      if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
      streamRef.current = stream;

      // Analyser for visualization
      const source = micCtx.createMediaStreamSource(stream);
      const analyser = micCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      monitorAudioLevel();

      // Processor to capture PCM and send to WebSocket
      const processor = micCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      source.connect(processor);
      processor.connect(micCtx.destination);

      // WebSocket
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('listening');
      };

      ws.onmessage = (e) => handleMessage(e);

      ws.onerror = (e) => {
        console.error('Voice WebSocket error:', e);
      };

      ws.onclose = () => {
        if (!cancelled) onClose();
      };

      // Send all audio — OpenAI's VAD handles speech detection and interruption
      processor.onaudioprocess = (e) => {
        if (ws.readyState !== WebSocket.OPEN) return;

        const float32 = e.inputBuffer.getChannelData(0);

        // Resample from micCtx.sampleRate to 24000 if needed
        const inputRate = micCtx.sampleRate;
        let samples = float32;
        if (inputRate !== 24000) {
          const ratio = 24000 / inputRate;
          const newLength = Math.round(float32.length * ratio);
          samples = new Float32Array(newLength);
          for (let i = 0; i < newLength; i++) {
            const srcIndex = i / ratio;
            const idx = Math.floor(srcIndex);
            const frac = srcIndex - idx;
            const a = float32[idx] || 0;
            const b = float32[Math.min(idx + 1, float32.length - 1)] || 0;
            samples[i] = a + (b - a) * frac;
          }
        }

        // Convert Float32 to Int16
        const int16 = new Int16Array(samples.length);
        for (let i = 0; i < samples.length; i++) {
          const s = Math.max(-1, Math.min(1, samples[i]));
          int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Convert to base64
        const uint8 = new Uint8Array(int16.buffer);
        let binary = '';
        for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
        const base64 = btoa(binary);

        ws.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: base64,
        }));
      };
    };

    start().catch((err) => {
      console.error('Voice mode init failed:', err);
      onClose();
    });

    return () => {
      cancelled = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (processorRef.current) processorRef.current.disconnect();
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (micCtxRef.current) micCtxRef.current.close();
      if (playCtxRef.current) playCtxRef.current.close();
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) wsRef.current.close();
    };
  }, []);

  // Orb animation
  const orbScale = status === 'speaking'
    ? 1 + audioLevel * 0.5
    : status === 'listening'
      ? 1 + audioLevel * 0.3
      : 1;

  const orbColor = {
    connecting: 'rgba(156, 163, 175, 0.3)',
    listening: 'rgba(16, 163, 127, 0.4)',
    thinking: 'rgba(234, 179, 8, 0.4)',
    speaking: 'rgba(16, 163, 127, 0.6)',
  }[status];

  const statusText = {
    connecting: 'Qoşulur...',
    listening: 'Dinləyirəm...',
    thinking: 'Düşünürəm...',
    speaking: '',
  }[status];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--app-bg)]">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--app-surface-hover)] text-[var(--app-text-muted)] transition-colors hover:text-[var(--app-text)]"
      >
        <X size={20} />
      </button>

      {/* Orb */}
      <div className="relative flex items-center justify-center">
        <div
          className="absolute rounded-full blur-3xl transition-all duration-300"
          style={{
            width: `${160 * orbScale}px`,
            height: `${160 * orbScale}px`,
            backgroundColor: orbColor,
          }}
        />
        <div
          className="relative rounded-full border border-white/10 transition-all duration-150"
          style={{
            width: `${100 * orbScale}px`,
            height: `${100 * orbScale}px`,
            background: `radial-gradient(circle, ${orbColor} 0%, transparent 70%)`,
            boxShadow: `0 0 ${40 * orbScale}px ${orbColor}`,
          }}
        />
      </div>

      {/* Status */}
      <p className="mt-8 text-sm text-[var(--app-text-muted)]">
        {statusText}
      </p>

      {/* User transcript */}
      {userTranscript && (
        <p className="mt-4 max-w-md px-4 text-center text-sm text-[var(--app-text-muted)] opacity-60">
          {userTranscript}
        </p>
      )}

      {/* AI transcript */}
      {aiTranscript && (
        <p className="mt-2 max-w-md px-4 text-center text-base text-[var(--app-text)]">
          {aiTranscript}
        </p>
      )}
    </div>
  );
}
