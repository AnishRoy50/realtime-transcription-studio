'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, Square, Activity, FileText, Clock, Hash } from 'lucide-react';
import { clsx } from 'clsx';

interface Session {
  id: string;
  started_at: string;
  audio_duration_seconds: number;
  word_count: number;
  final_transcript: string;
}

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('Ready');
  const [transcript, setTranscript] = useState('');
  const [partialTranscript, setPartialTranscript] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  
  const socketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const isRecordingRef = useRef(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/sessions/');
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Connect to WebSocket
      const socket = new WebSocket('ws://localhost:8000/ws');
      socketRef.current = socket;

      socket.onopen = async () => {
        setStatus('Recording');
        setIsRecording(true);
        isRecordingRef.current = true;
        setTranscript('');
        setPartialTranscript('');
        
        // Setup Audio Processing
        const audioContext = new AudioContext({ sampleRate: 16000 });
        audioContextRef.current = audioContext;
        
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }
        
        const input = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;
        
        input.connect(processor);
        processor.connect(audioContext.destination);
        
        processor.onaudioprocess = (e) => {
          if (socket.readyState === WebSocket.OPEN) {
            const inputData = e.inputBuffer.getChannelData(0);
            // Convert float32 to int16
            const buffer = new ArrayBuffer(inputData.length * 2);
            const view = new DataView(buffer);
            for (let i = 0; i < inputData.length; i++) {
              let s = Math.max(-1, Math.min(1, inputData[i]));
              view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
            }
            socket.send(buffer);
          }
        };
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'final') {
          setTranscript(prev => prev + data.text + ' ');
          setPartialTranscript('');
        } else if (data.type === 'partial') {
          setPartialTranscript(data.text);
        }
      };

      socket.onclose = (event) => {
        console.log("Socket closed", event);
        if (isRecordingRef.current) {
             if (event.code === 1011) {
                 alert("Backend Error: " + event.reason);
             } else if (event.code !== 1000) {
                 console.warn("Connection closed unexpectedly");
             }
        }
        setStatus('Disconnected');
        setIsRecording(false);
        isRecordingRef.current = false;
        fetchSessions(); // Refresh list after recording
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setStatus('Error');
      };

    } catch (err) {
      console.error('Error accessing microphone:', err);
      setStatus('Microphone Error');
    }
  };

  const stopRecording = () => {
    if (socketRef.current) {
      socketRef.current.close();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsRecording(false);
    isRecordingRef.current = false;
    setStatus('Ready');
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              AlphaNet Transcription
            </h1>
            <p className="text-gray-400 mt-2">Real-time CPU-only speech recognition</p>
          </div>
          <div className={clsx(
            "px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium",
            isRecording ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"
          )}>
            <div className={clsx(
              "w-2 h-2 rounded-full",
              isRecording ? "bg-red-400 animate-pulse" : "bg-green-400"
            )} />
            {status}
          </div>
        </div>

        {/* Main Controls & Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Controls */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                Controls
              </h2>
              <div className="flex gap-4">
                <button
                  onClick={startRecording}
                  disabled={isRecording}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  <Mic className="w-5 h-5" />
                  Start
                </button>
                <button
                  onClick={stopRecording}
                  disabled={!isRecording}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  <Square className="w-5 h-5" />
                  Stop
                </button>
              </div>
            </div>

            {/* Session History */}
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 h-[400px] overflow-y-auto">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 sticky top-0 bg-gray-800 pb-2">
                <FileText className="w-5 h-5 text-purple-400" />
                History
              </h2>
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div key={session.id} className="bg-gray-900/50 p-4 rounded-xl border border-gray-700/50 hover:border-gray-600 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs text-gray-500">
                        {new Date(session.started_at).toLocaleString()}
                      </span>
                      <div className="flex gap-2">
                        <span className="text-xs bg-gray-700 px-2 py-1 rounded-md text-gray-300 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {session.audio_duration_seconds?.toFixed(1) || '0.0'}s
                        </span>
                        <span className="text-xs bg-gray-700 px-2 py-1 rounded-md text-gray-300 flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          {session.word_count || 0}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 line-clamp-2">
                      {session.final_transcript || "No transcript"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Transcript */}
          <div className="md:col-span-2 bg-gray-800 rounded-2xl p-6 border border-gray-700 min-h-[500px] flex flex-col">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-400" />
              Live Transcript
            </h2>
            <div className="flex-1 bg-gray-900/50 rounded-xl p-6 font-mono text-lg leading-relaxed overflow-y-auto">
              <span className="text-gray-100">{transcript}</span>
              <span className="text-gray-500">{partialTranscript}</span>
              {isRecording && (
                <span className="inline-block w-2 h-5 ml-1 bg-blue-500 animate-pulse align-middle" />
              )}
            </div>
            
            {/* Stats */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-gray-900/50 p-3 rounded-lg flex items-center gap-3">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">Duration</span>
                <span className="ml-auto font-mono">
                  {/* Simple timer could go here */}
                  --:--
                </span>
              </div>
              <div className="bg-gray-900/50 p-3 rounded-lg flex items-center gap-3">
                <Hash className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">Words</span>
                <span className="ml-auto font-mono">
                  {(transcript.trim().split(/\s+/).length + (partialTranscript ? 1 : 0)) || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
