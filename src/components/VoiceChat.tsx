import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, MessageSquare, X } from 'lucide-react';

export default function VoiceChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const hasSpokenRef = useRef<boolean>(false); // tracks if any audio played

  const toggleConnection = async () => {
    if (isConnected) {
      stopConnection();
    } else {
      startConnection();
    }
  };

  const startConnection = async () => {
    try {
      setIsOpen(true);
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = async () => {
        setIsConnected(true);
        outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        nextStartTimeRef.current = 0;
        
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
          const source = audioCtxRef.current.createMediaStreamSource(stream);
          processorRef.current = audioCtxRef.current.createScriptProcessor(4096, 1, 1);
          source.connect(processorRef.current);
          processorRef.current.connect(audioCtxRef.current.destination);

          processorRef.current.onaudioprocess = (e) => {
            if (wsRef.current?.readyState === WebSocket.OPEN && isRecording) {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcm16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
              }
              const buffer = pcm16.buffer;
              
              let binary = '';
              const bytes = new Uint8Array(buffer);
              for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              const base64 = btoa(binary);
              wsRef.current.send(JSON.stringify({ audio: base64 }));
            }
          };
        } catch (err) {
          console.error("Mic error:", err);
          stopConnection();
        }
      };

      wsRef.current.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.interrupted) {
          nextStartTimeRef.current = 0;
          setIsAiSpeaking(false);
        }
        if (msg.audio) {
          setIsAiSpeaking(true);
          hasSpokenRef.current = true;
          playAudioChunk(msg.audio);
          
          // automatically turn off isAiSpeaking after a while (naive reset)
          clearTimeout((window as any).speechTimeout);
          (window as any).speechTimeout = setTimeout(() => {
            setIsAiSpeaking(false);
          }, 1000);
        }
      };

      wsRef.current.onclose = () => {
        stopConnection();
      };

    } catch (err) {
      console.error(err);
    }
  };

  const stopConnection = () => {
    setIsConnected(false);
    setIsRecording(false);
    setIsAiSpeaking(false);
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close();
      outputAudioCtxRef.current = null;
    }
  };

  const playAudioChunk = (base64: string) => {
    if (!outputAudioCtxRef.current) return;
    
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const pcm16 = new Int16Array(bytes.buffer);
    const audioBuffer = outputAudioCtxRef.current.createBuffer(1, pcm16.length, 24000);
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < pcm16.length; i++) {
      channelData[i] = pcm16[i] / 0x7FFF;
    }

    const source = outputAudioCtxRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(outputAudioCtxRef.current.destination);

    const currentTime = outputAudioCtxRef.current.currentTime;
    if (nextStartTimeRef.current < currentTime) {
      nextStartTimeRef.current = currentTime;
    }
    
    source.start(nextStartTimeRef.current);
    nextStartTimeRef.current += audioBuffer.duration;
  };

  const toggleMic = () => {
    setIsRecording(!isRecording);
  };

  // Close completely
  if (!isOpen) {
    return (
      <button 
        onClick={startConnection}
        className="fixed bottom-6 right-6 p-4 rounded-full bg-primary text-white shadow-xl hover:scale-105 active:scale-95 transition-all z-50 animate-bounce group"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="absolute right-full mr-4 bg-slate-800 text-white text-xs whitespace-nowrap px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Talk to our Appulence Champion
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 flex flex-col">
      <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          <h3 className="font-bold text-sm text-slate-800">Appulence Champion</h3>
        </div>
        <button onClick={() => { stopConnection(); setIsOpen(false); }} className="text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="p-6 flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          {isAiSpeaking ? (
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping scale-150" />
          ) : null}
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center border-4 border-white shadow-inner relative z-10">
            {isConnected ? (
              <MessageSquare className={`w-8 h-8 ${isAiSpeaking ? 'text-primary' : 'text-slate-400'}`} />
            ) : (
              <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            )}
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm font-medium text-slate-800">
            {isConnected ? (isAiSpeaking ? 'Champion is speaking...' : (isRecording ? 'Listening...' : 'Mic paused')) : 'Connecting to Champion...'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {hasSpokenRef.current ? 'Feel free to ask about our school apps!' : 'Say "Hello" to get started'}
          </p>
        </div>

        {isConnected && (
          <button
            onClick={toggleMic}
            className={`mt-4 p-4 rounded-full transition-all flex items-center justify-center shadow-md ${
              isRecording 
                ? 'bg-rose-50 text-rose-500 border border-rose-200 hover:bg-rose-100' 
                : 'bg-primary text-white hover:bg-primary/90'
            }`}
          >
            {isRecording ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </button>
        )}
      </div>
    </div>
  );
}
