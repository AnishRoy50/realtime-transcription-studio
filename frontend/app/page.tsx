'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Mic, Square, Activity, FileText, Clock, Hash, 
  Copy, Download, ChevronRight, History, Trash2, CheckCircle2 
} from 'lucide-react';
import { clsx } from 'clsx';

// --- Environment Variables ---
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const WS_URL = process.env.NEXT_PUBLIC_WS_URL;

// --- Types ---
interface Session {
  id: string;
  started_at: string;
  audio_duration_seconds: number;
  word_count: number;
  final_transcript: string;
}

// --- Components ---

const AudioVisualizer = ({ isRecording, audioContext, source }: { isRecording: boolean, audioContext: AudioContext | null, source: MediaStreamAudioSourceNode | null }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!isRecording || !audioContext || !source || !canvasRef.current) return;

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;
        
        // Gradient for bars
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#3B82F6'); // Blue
        gradient.addColorStop(1, '#8B5CF6'); // Purple

        ctx.fillStyle = gradient;
        
        // Rounded tops for bars
        ctx.beginPath();
        ctx.roundRect(x, canvas.height - barHeight, barWidth, barHeight, [4, 4, 0, 0]);
        ctx.fill();

        x += barWidth + 2;
      }
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      analyser.disconnect();
    };
  }, [isRecording, audioContext, source]);

  if (!isRecording) return <div className="h-16 w-full bg-slate-800/50 rounded-xl border border-slate-700/50 flex items-center justify-center text-slate-500 text-sm">Microphone Idle</div>;

  return (
    <div className="w-full h-16 overflow-hidden rounded-xl bg-slate-900/50 border border-slate-700/50 backdrop-blur-sm">
      <canvas ref={canvasRef} width={600} height={64} className="w-full h-full" />
    </div>
  );
};

const SessionSummaryModal = ({ 
  isOpen, 
  onClose, 
  transcript, 
  wordCount, 
  duration 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  transcript: string; 
  wordCount: number; 
  duration: string; 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Session Details</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            ✕
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Duration</span>
              </div>
              <p className="text-2xl font-bold text-white">{duration}</p>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Hash className="w-4 h-4" />
                <span className="text-sm font-medium">Word Count</span>
              </div>
              <p className="text-2xl font-bold text-white">{wordCount}</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Final Transcript
            </label>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300 leading-relaxed max-h-60 overflow-y-auto custom-scrollbar">
              {transcript || <span className="italic text-slate-600">No speech detected.</span>}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-800/30 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const SessionCard = ({ session, onClick }: { session: Session; onClick: (session: Session) => void }) => (
  <div 
    onClick={() => onClick(session)}
    className="group p-4 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
  >
    <div className="flex justify-between items-start mb-2">
      <span className="text-xs font-medium text-slate-500 group-hover:text-slate-400 transition-colors">
        {new Date(session.started_at).toLocaleDateString()} • {new Date(session.started_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
      </span>
      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors" />
    </div>
    <p className="text-sm text-slate-300 line-clamp-2 mb-3 font-light leading-relaxed">
      {session.final_transcript || <span className="italic text-slate-600">No transcript available</span>}
    </p>
    <div className="flex gap-2">
      <span className="text-[10px] bg-slate-900/50 px-2 py-1 rounded-md text-slate-400 flex items-center gap-1 border border-slate-800">
        <Clock className="w-3 h-3" />
        {session.audio_duration_seconds?.toFixed(1) || '0.0'}s
      </span>
      <span className="text-[10px] bg-slate-900/50 px-2 py-1 rounded-md text-slate-400 flex items-center gap-1 border border-slate-800">
        <Hash className="w-3 h-3" />
        {session.word_count || 0} words
      </span>
    </div>
  </div>
);

// --- Main Page ---

export default function Home() {
  // State
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState<'Ready' | 'Connecting' | 'Recording' | 'Processing' | 'Error'>('Ready');
  const [transcript, setTranscript] = useState('');
  const [partialTranscript, setPartialTranscript] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  
  // Refs
  const socketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<AudioNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout>();
  const isRecordingRef = useRef(false);

  // Effects
  useEffect(() => {
    fetchSessions();
    return () => {
      if (isRecordingRef.current) {
        stopRecordingCleanup();
      }
    };
  }, []);

  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript, partialTranscript]);

  // Actions
  const fetchSessions = async () => {
    try {
      const res = await fetch(`${API_URL}/sessions/`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleHistoryClick = (session: Session) => {
    setSelectedSession(session);
    setShowSummary(true);
  };

  const startRecording = async () => {
    try {
      setStatus('Connecting');

      if (!WS_URL) {
        setStatus('Error');
        alert('WebSocket URL is not configured. Please set NEXT_PUBLIC_WS_URL in your environment.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const socket = new WebSocket(WS_URL);
      socketRef.current = socket;

      socket.onopen = async () => {
        setStatus('Recording');
        setIsRecording(true);
        isRecordingRef.current = true;
        setTranscript('');
        setPartialTranscript('');
        setElapsedTime(0);
        setShowSummary(false);
        setSelectedSession(null);
        
        timerRef.current = setInterval(() => {
          setElapsedTime(prev => prev + 1);
        }, 1000);
        
        const audioContext = new AudioContext({ sampleRate: 16000 });
        audioContextRef.current = audioContext;
        
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }
        
        const input = audioContext.createMediaStreamSource(stream);
        sourceRef.current = input;
        
        // Use AudioWorklet for raw audio data access (Web Audio API)
        try {
          await audioContext.audioWorklet.addModule('/audio-processor.js');
        } catch (err) {
          console.error('Failed to load audio processor worklet:', err);
          throw err;
        }

        const processor = new AudioWorkletNode(audioContext, 'audio-processor');
        processorRef.current = processor;
        
        input.connect(processor);
        processor.connect(audioContext.destination);
        
        processor.port.onmessage = (e) => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(e.data);
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
        if (isRecordingRef.current && event.code === 1011) {
             alert("Backend Error: " + event.reason);
        }
        stopRecordingCleanup();
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setStatus('Error');
      };

    } catch (err) {
      console.error('Error accessing microphone:', err);
      setStatus('Error');
      alert('Could not access microphone. Please ensure you have granted permission.');
    }
  };

  const stopRecordingCleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Only show summary if we actually recorded something
    if (isRecordingRef.current) {
      const currentSession: Session = {
        id: 'current',
        started_at: new Date().toISOString(),
        audio_duration_seconds: elapsedTime,
        word_count: transcript.trim().split(/\s+/).filter(w => w.length > 0).length,
        final_transcript: transcript
      };
      setSelectedSession(currentSession);
      setShowSummary(true);
    }

    setStatus('Ready');
    setIsRecording(false);
    isRecordingRef.current = false;
    fetchSessions();
  };

  const stopRecording = () => {
    if (socketRef.current) socketRef.current.close();
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    if (audioContextRef.current) audioContextRef.current.close();
    stopRecordingCleanup();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(transcript);
  };

  const downloadTranscript = () => {
    const element = document.createElement("a");
    const file = new Blob([transcript], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `transcript-${new Date().toISOString()}.txt`;
    document.body.appendChild(element);
    element.click();
  };

  const wordCount = (transcript.trim().split(/\s+/).length + (partialTranscript ? 1 : 0)) || 0;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      
      <SessionSummaryModal 
        isOpen={showSummary} 
        onClose={() => setShowSummary(false)}
        transcript={selectedSession?.final_transcript || ''}
        wordCount={selectedSession?.word_count || 0}
        duration={selectedSession?.audio_duration_seconds ? selectedSession.audio_duration_seconds.toFixed(1) + 's' : '0.0s'}
      />

      {/* Top Navigation Bar */}
      <nav className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md fixed top-0 w-full z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white">Transcription Studio</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={clsx(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
            status === 'Recording' 
              ? "bg-red-500/10 border-red-500/20 text-red-400" 
              : status === 'Connecting'
              ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
              : "bg-slate-800 border-slate-700 text-slate-400"
          )}>
            <div className={clsx("w-2 h-2 rounded-full", status === 'Recording' ? "bg-red-500 animate-pulse" : "bg-slate-500")} />
            {status}
          </div>
        </div>
      </nav>

      <div className="pt-16 h-screen flex">
        
        {/* Sidebar - History */}
        <aside className="w-80 border-r border-slate-800 bg-slate-900/30 hidden md:flex flex-col">
          <div className="p-4 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4" />
              Recent Sessions
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} onClick={handleHistoryClick} />
            ))}
            {sessions.length === 0 && (
              <div className="text-center py-10 text-slate-600 text-sm">
                No history yet.
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <section className="flex-1 flex flex-col relative bg-gradient-to-b from-slate-950 to-slate-900">
          
          {/* Transcript View */}
          <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
            <div className="max-w-3xl mx-auto space-y-6">
              {transcript || partialTranscript ? (
                <>
                  <p className="text-lg md:text-xl leading-relaxed text-slate-300 whitespace-pre-wrap">
                    {transcript}
                    <span className="text-blue-400 animate-pulse">{partialTranscript}</span>
                  </p>
                </>
              ) : (
                <div className="h-[60vh] flex flex-col items-center justify-center text-slate-600 gap-6">
                  <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                    <Mic className="w-8 h-8 opacity-40" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-medium text-slate-400">Ready to Transcribe</h3>
                    <p className="text-sm max-w-xs mx-auto">Click the microphone button below to start real-time transcription.</p>
                  </div>
                </div>
              )}
              <div ref={transcriptEndRef} />
            </div>
          </div>

          {/* Bottom Control Bar */}
          <div className="border-t border-slate-800 bg-slate-950/90 backdrop-blur-xl p-6">
            <div className="max-w-4xl mx-auto flex flex-col gap-6">
              
              {/* Visualizer & Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="md:col-span-2">
                  <AudioVisualizer 
                    isRecording={isRecording} 
                    audioContext={audioContextRef.current} 
                    source={sourceRef.current} 
                  />
                </div>
                <div className="flex justify-end gap-2">
                   <button 
                    onClick={copyToClipboard}
                    disabled={!transcript}
                    className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Copy Text"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={downloadTranscript}
                    disabled={!transcript}
                    className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Download File"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Main Controls */}
              <div className="flex items-center justify-center gap-6">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="group relative flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-semibold transition-all shadow-lg shadow-blue-900/20 hover:shadow-blue-600/30 hover:-translate-y-0.5"
                  >
                    <Mic className="w-5 h-5" />
                    <span>Start Recording</span>
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="group relative flex items-center gap-3 px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-full font-semibold transition-all shadow-lg shadow-red-900/20 hover:shadow-red-600/30 hover:-translate-y-0.5"
                  >
                    <Square className="w-5 h-5 fill-current" />
                    <span>Stop Recording</span>
                    <span className="absolute -top-2 -right-2 bg-slate-900 text-slate-200 text-xs font-mono px-2 py-1 rounded-full border border-slate-700">
                      {formatTime(elapsedTime)}
                    </span>
                  </button>
                )}
              </div>

            </div>
          </div>

        </section>
      </div>
    </main>
  );
}
