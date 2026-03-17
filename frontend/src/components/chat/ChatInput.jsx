import { useState, useRef, useEffect } from 'react';
import { Plus, Mic, AudioLines, ArrowUp, X, Check } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import { apiUpload } from '../../services/api';
import VoiceMode from '../voice/VoiceMode';

export default function ChatInput() {
  const { sendMessage, createNewChat } = useChat();
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const textareaRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, [text]);

  // Start waveform drawing when recording starts and canvas is mounted
  useEffect(() => {
    if (isRecording && canvasRef.current && analyserRef.current) {
      drawWaveform();
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRecording]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(text);
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const historyRef = useRef([]);
  const TOTAL_BARS = 120;

  const drawWaveform = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    // Initialize history with silence
    if (historyRef.current.length === 0) {
      historyRef.current = new Array(TOTAL_BARS).fill(0);
    }

    let frameCount = 0;

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      frameCount++;

      // Push a new sample every 3 frames (~20 samples/sec at 60fps)
      if (frameCount % 3 === 0) {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length * 0.4; i++) sum += dataArray[i];
        const level = sum / (dataArray.length * 0.4) / 255;
        historyRef.current.push(level);
        if (historyRef.current.length > TOTAL_BARS) {
          historyRef.current.shift();
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = 2;
      const gap = 2;
      const step = barWidth + gap;
      const centerY = canvas.height / 2;
      const maxH = canvas.height * 0.75;
      const minH = 1.5;
      const totalWidth = TOTAL_BARS * step;
      const offsetX = (canvas.width - totalWidth) / 2;

      for (let i = 0; i < historyRef.current.length; i++) {
        const level = historyRef.current[i];
        const h = Math.max(minH, level * maxH);
        const x = offsetX + i * step;

        // Fade edges — bars near edges are more transparent
        const distFromCenter = Math.abs(i - TOTAL_BARS / 2) / (TOTAL_BARS / 2);
        const alpha = 0.15 + (1 - distFromCenter) * 0.45;

        ctx.fillStyle = `rgba(156, 163, 175, ${alpha})`;
        ctx.beginPath();
        ctx.roundRect(x, centerY - h / 2, barWidth, h, 1);
        ctx.fill();
      }
    };

    draw();
  };

  const audioCtxRef = useRef(null);
  const processorRef = useRef(null);
  const pcmRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;

      // Set up audio context at 16kHz
      const audioCtx = new AudioContext({ sampleRate: 16000 });
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);

      // Analyser for waveform visualization
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      // ScriptProcessor to capture raw PCM at 16kHz mono
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      pcmRef.current = [];
      processor.onaudioprocess = (e) => {
        const data = e.inputBuffer.getChannelData(0);
        pcmRef.current.push(new Float32Array(data));
      };
      source.connect(processor);
      processor.connect(audioCtx.destination);
      processorRef.current = processor;

      setIsRecording(true);
    } catch (err) {
      console.error('Mic access denied:', err);
    }
  };

  const buildWav = (sampleRate) => {
    // Merge all PCM chunks
    const totalLength = pcmRef.current.reduce((sum, chunk) => sum + chunk.length, 0);
    const pcm = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of pcmRef.current) {
      pcm.set(chunk, offset);
      offset += chunk.length;
    }

    // Convert float32 to int16
    const int16 = new Int16Array(pcm.length);
    for (let i = 0; i < pcm.length; i++) {
      const s = Math.max(-1, Math.min(1, pcm[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    // Build WAV file
    const buffer = new ArrayBuffer(44 + int16.length * 2);
    const view = new DataView(buffer);
    const writeStr = (o, str) => { for (let i = 0; i < str.length; i++) view.setUint8(o + i, str.charCodeAt(i)); };

    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + int16.length * 2, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);           // PCM
    view.setUint16(22, 1, true);           // mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);          // 16-bit
    writeStr(36, 'data');
    view.setUint32(40, int16.length * 2, true);

    const int16Bytes = new Uint8Array(int16.buffer);
    new Uint8Array(buffer).set(int16Bytes, 44);

    return new Blob([buffer], { type: 'audio/wav' });
  };

  const stopAndTranscribe = async () => {
    // Stop waveform animation
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    historyRef.current = [];

    // Disconnect processor and stop stream
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    const sampleRate = audioCtxRef.current?.sampleRate || 16000;
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }

    setIsRecording(false);

    if (pcmRef.current.length === 0) return;

    const wavBlob = buildWav(sampleRate);
    pcmRef.current = [];

    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('file', wavBlob, 'recording.wav');
      const result = await apiUpload('/api/transcribe', formData);
      if (result.text) {
        setText((prev) => (prev ? prev + ' ' + result.text : result.text));
      }
    } catch (err) {
      console.error('Transcription failed:', err);
    } finally {
      setIsTranscribing(false);
    }
  };

  const cancelRecording = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    historyRef.current = [];
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    pcmRef.current = [];
    setIsRecording(false);
  };

  const hasText = text.trim().length > 0;

  // Recording mode UI
  if (isRecording) {
    return (
      <div className="px-4 pb-4 pt-2 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center gap-2 rounded-[26px] bg-[var(--app-surface-hover)] px-2 py-2">
          {/* + button (disabled) */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--app-text-muted)] opacity-30">
            <Plus size={20} />
          </div>

          {/* Waveform */}
          <div className="flex-1 flex items-center">
            <canvas
              ref={canvasRef}
              width={600}
              height={36}
              className="w-full h-9"
            />
          </div>

          {/* Cancel */}
          <button
            onClick={cancelRecording}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--app-text-muted)] transition-colors hover:bg-[var(--app-border)] hover:text-[var(--app-text)]"
          >
            <X size={20} />
          </button>

          {/* Confirm */}
          <button
            onClick={stopAndTranscribe}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--app-text)] text-[var(--app-bg)] transition-transform hover:scale-105 active:scale-95"
          >
            <Check size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-4 pt-2 sm:px-6">
      <div className="mx-auto flex max-w-3xl items-end gap-0 rounded-[26px] bg-[var(--app-surface-hover)] px-2 py-2">
        {/* + New chat */}
        <button
          onClick={createNewChat}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--app-text-muted)] transition-colors hover:bg-[var(--app-border)] hover:text-[var(--app-text)]"
        >
          <Plus size={20} />
        </button>

        {/* Text area */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isTranscribing ? 'Transkripsiya olunur...' : 'Ask anything'}
          rows={1}
          disabled={isTranscribing}
          className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-[var(--app-text)] placeholder-[var(--app-text-muted)] outline-none disabled:opacity-50"
        />

        {/* Right icons */}
        {hasText ? (
          <button
            onClick={handleSend}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--app-text)] text-[var(--app-bg)] transition-transform hover:scale-105 active:scale-95"
          >
            <ArrowUp size={18} />
          </button>
        ) : (
          <>
            <button
              onClick={startRecording}
              disabled={isTranscribing}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--app-text-muted)] transition-colors hover:bg-[var(--app-border)] hover:text-[var(--app-text)] ${isTranscribing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Mic size={20} />
            </button>
            <button
              onClick={() => setVoiceMode(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--app-text)] text-[var(--app-bg)] transition-colors hover:scale-105 active:scale-95"
            >
              <AudioLines size={20} />
            </button>
          </>
        )}
      </div>

      {/* Voice mode overlay */}
      {voiceMode && <VoiceMode onClose={() => setVoiceMode(false)} />}
    </div>
  );
}
