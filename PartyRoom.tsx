import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Users,
  Copy,
  Check,
  Heart,
  Smartphone,
  Video,
  Flame,
  Laugh,
  Angry,
  Sparkles,
  Lock,
  Upload,
  Loader2,
  Crown,
  LogOut,
  Smile,
  Plus,
  Trash,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Sun,
  Mic,
  MicOff,
  VideoOff,
  Phone,
  PhoneOff,
  Camera
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { RoomState, ChatMessage, FloatingReaction, User } from "../types";
import SyncedPlayer from "./SyncedPlayer";
import NiporaLogo from "./NiporaLogo";

// Web Audio API Sound Synthesizer for high-end call chimes
const playCallSound = (type: "ring" | "join" | "leave") => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    if (type === "join") {
      // Sweet rising high chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.25); // C6
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.05);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === "leave") {
      // Soft falling chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.25); // A4
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.05);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === "ring") {
      // Soft couples double-ring tone
      const playTone = (delay: number) => {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.type = "sine";
        osc2.type = "sine";
        osc1.frequency.setValueAtTime(480, ctx.currentTime + delay);
        osc2.frequency.setValueAtTime(440, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + delay + 0.05);
        gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + delay + 0.35);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + delay + 0.45);
        osc1.start(ctx.currentTime + delay);
        osc2.start(ctx.currentTime + delay);
        osc1.stop(ctx.currentTime + delay + 0.45);
        osc2.stop(ctx.currentTime + delay + 0.45);
      };
      playTone(0);
      playTone(0.5);
    }
  } catch (err) {
    console.warn("Audio feedback block:", err);
  }
};

interface PartyRoomProps {
  roomState: RoomState;
  userId: string;
  socket: WebSocket | null;
  onSyncAction: (action: "play" | "pause" | "seek", time: number) => void;
  localTimeRef: React.MutableRefObject<number>;
  reactions: FloatingReaction[];
  onTriggerReaction: (emoji: string) => void;
  isPremium: boolean;
  setIsPremium: (val: boolean) => void;
  isInVoice: boolean;
  setIsInVoice: (val: boolean) => void;
  isMuted: boolean;
  setIsMuted: (val: boolean) => void;
  isCameraOn: boolean;
  setIsCameraOn: (val: boolean) => void;
  userLocation: { latitude?: number; longitude?: number; locationName?: string };
  setUserLocation: (loc: { latitude?: number; longitude?: number; locationName?: string }) => void;
  onLocalRoomStateUpdate?: (updatedFields: Partial<RoomState>) => void;
  onGoBackToHome?: () => void;
}

export default function PartyRoom({
  roomState,
  userId,
  socket,
  onSyncAction,
  localTimeRef,
  reactions,
  onTriggerReaction,
  isPremium,
  setIsPremium,
  isInVoice,
  setIsInVoice,
  isMuted,
  setIsMuted,
  isCameraOn,
  setIsCameraOn,
  userLocation,
  setUserLocation,
  onLocalRoomStateUpdate,
  onGoBackToHome
}: PartyRoomProps) {
  const [copied, setCopied] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [customUrlInput, setCustomUrlInput] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadSpeed, setUploadSpeed] = useState<string>("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedFileForUpload, setSelectedFileForUpload] = useState<File | null>(null);
  const [localFileBlobUrl, setLocalFileBlobUrl] = useState<string | null>(null);
  const [selectedFileForPrompt, setSelectedFileForPrompt] = useState<File | null>(null);

  // Live Cozy Voice & Video Call states
  const [localMicLevel, setLocalMicLevel] = useState<number>(0);
  const [isCallingPartner, setIsCallingPartner] = useState(false);
  const [incomingCallFrom, setIncomingCallFrom] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Listen for incoming call simulation or alerts via chat/pings
  useEffect(() => {
    // If our partner joins voice but we are not, show an inviting notification in the chat or as a prompt
    const partners = Object.values(roomState.users).filter((u) => u.userId !== userId);
    if (partners.length > 0) {
      const activePartner = partners[0];
      if (activePartner.isInVoice && !isInVoice && !incomingCallFrom && !isCallingPartner) {
        // Trigger a sweet ring sound and show calling invite
        setIncomingCallFrom(activePartner.username);
        playCallSound("ring");
      } else if (!activePartner.isInVoice && incomingCallFrom) {
        setIncomingCallFrom(null);
      }
    }
  }, [roomState.users, isInVoice]);

  // Real-time microphone level analyzer & visualizer hook
  useEffect(() => {
    if (isInVoice && !isMuted) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          streamRef.current = stream;
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const ctx = new AudioContextClass();
          audioContextRef.current = ctx;
          
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          analyserRef.current = analyser;
          
          const source = ctx.createMediaStreamSource(stream);
          sourceRef.current = source;
          source.connect(analyser);
          
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          dataArrayRef.current = dataArray;
          
          const updateVolume = () => {
            if (!analyserRef.current || !dataArrayRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArrayRef.current);
            let sum = 0;
            for (let i = 0; i < dataArrayRef.current.length; i++) {
              sum += dataArrayRef.current[i];
            }
            const average = sum / dataArrayRef.current.length;
            setLocalMicLevel(Math.min(100, Math.floor((average / 128) * 100)));
            animationFrameRef.current = requestAnimationFrame(updateVolume);
          };
          updateVolume();
        })
        .catch((err) => {
          console.warn("Could not access microphone, using romantic visualizer simulation instead:", err);
          let simDir = 1;
          let simVal = 20;
          const interval = setInterval(() => {
            simVal += simDir * (Math.random() * 8 + 2);
            if (simVal > 70) simDir = -1;
            if (simVal < 12) simDir = 1;
            setLocalMicLevel(Math.floor(simVal));
          }, 150);
          (window as any)._micSimInterval = interval;
        });
    } else {
      cleanupAudio();
    }
    
    return () => {
      cleanupAudio();
    };

    function cleanupAudio() {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if ((window as any)._micSimInterval) {
        clearInterval((window as any)._micSimInterval);
        (window as any)._micSimInterval = null;
      }
      setLocalMicLevel(0);
    }
  }, [isInVoice, isMuted]);

  // Real-time camera feed hook
  useEffect(() => {
    if (isCameraOn && isInVoice) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then((stream) => {
          videoStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.warn("Could not access camera for visual stream:", err);
        });
    } else {
      cleanupVideo();
    }
    return () => {
      cleanupVideo();
    };

    function cleanupVideo() {
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach(track => track.stop());
        videoStreamRef.current = null;
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    }
  }, [isCameraOn, isInVoice]);

  // Trigger cozy join sound
  useEffect(() => {
    if (isInVoice) {
      playCallSound("join");
    } else {
      playCallSound("leave");
    }
  }, [isInVoice]);

  const handleStartCall = () => {
    setIsCallingPartner(true);
    playCallSound("ring");
    
    // Simulate partner picking up after 2.5 seconds if they are online
    setTimeout(() => {
      setIsCallingPartner(false);
      setIsInVoice(true);
    }, 2500);
  };

  const handleAcceptCall = () => {
    setIncomingCallFrom(null);
    setIsInVoice(true);
  };

  const handleDeclineCall = () => {
    setIncomingCallFrom(null);
  };

  const handleHangUp = () => {
    setIsInVoice(false);
    setIsCameraOn(false);
  };

  // Auto-scroll chat history
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [roomState.chatHistory]);

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomState.roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket) return;

    socket.send(
      JSON.stringify({
        type: "chat_message",
        payload: { text: chatInput.trim() }
      })
    );
    setChatInput("");
  };

  const handleLoadCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrlInput.trim()) return;

    const url = customUrlInput.trim();
    const title = url.split("/").pop() || "Custom Video Stream";
    const videoType = url.includes("youtube.com") || url.includes("youtu.be") ? "youtube" : "direct";

    if (socket) {
      socket.send(
        JSON.stringify({
          type: "video_control",
          payload: {
            action: "change_video",
            url,
            title,
            videoType
          }
        })
      );
    }

    if (onLocalRoomStateUpdate) {
      onLocalRoomStateUpdate({
        videoUrl: url,
        videoTitle: title,
        videoType,
        isPlaying: false,
        currentTime: 0,
        lastUpdated: Date.now()
      });
    }
    setCustomUrlInput("");
  };

  const handleTriggerUpgrade = () => {
    if (socket) {
      socket.send(
        JSON.stringify({
          type: "premium_upgrade",
          payload: {}
        })
      );
      setIsPremium(true);
      setShowUpgradeModal(false);
      // If we had a file queued up that was oversized, let's upload it now!
      if (selectedFileForUpload) {
        performDirectUpload(selectedFileForUpload);
        setSelectedFileForUpload(null);
      }
    }
  };

  const handleFileUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleInitiateLocalSync = (file: File) => {
    const localUrl = URL.createObjectURL(file);
    setLocalFileBlobUrl(localUrl);

    if (socket) {
      socket.send(
        JSON.stringify({
          type: "video_control",
          payload: {
            action: "change_video",
            url: "local_blob",
            title: file.name,
            videoType: "local"
          }
        })
      );
    }

    if (onLocalRoomStateUpdate) {
      onLocalRoomStateUpdate({
        videoUrl: "local_blob",
        videoTitle: file.name,
        videoType: "local",
        isPlaying: false,
        currentTime: 0,
        lastUpdated: Date.now()
      });
    }
  };

  const processSelectedFile = (file: File) => {
    setUploadError(null);
    const sizeInGB = file.size / (1024 * 1024 * 1024);

    // Limit check: up to 5 GB is completely FREE!
    if (sizeInGB > 5) {
      setUploadError("Files above 5 GB are not supported due to network size limits. Please select a smaller movie.");
      return;
    }

    // Set file for choice prompt instead of immediate uploading
    setSelectedFileForPrompt(file);
  };

  const performDirectUpload = (file: File) => {
    setUploadProgress(0);
    setUploadSpeed("");
    setUploadError(null);

    const formData = new FormData();
    formData.append("video", file);
    formData.append("roomId", roomState.roomId);

    const host = window.location.host;
    let uploadUrl = "/api/upload";
    if (
      host.includes("vercel.app") ||
      host.includes("netlify.app") ||
      host.includes("github.dev")
    ) {
      uploadUrl = "https://ais-pre-7zpzhek72wbuzy24tstjds-612901282613.asia-southeast1.run.app/api/upload";
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadUrl, true);

    const startTime = Date.now();

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);

        // Calculate upload speed
        const elapsedSeconds = (Date.now() - startTime) / 1000;
        if (elapsedSeconds > 0) {
          const speedMBs = (event.loaded / (1024 * 1024)) / elapsedSeconds;
          setUploadSpeed(`${speedMBs.toFixed(1)} MB/s`);
        }
      }
    };

    xhr.onload = () => {
      setUploadProgress(null);
      if (xhr.status === 200) {
        try {
          const res = JSON.parse(xhr.responseText);
          let videoUrl = res.url;
          if (
            videoUrl.startsWith("/") &&
            (host.includes("vercel.app") ||
              host.includes("netlify.app") ||
              host.includes("github.dev"))
          ) {
            videoUrl = `https://ais-pre-7zpzhek72wbuzy24tstjds-612901282613.asia-southeast1.run.app${videoUrl}`;
          }

          if (socket) {
            socket.send(
              JSON.stringify({
                type: "video_control",
                payload: {
                  action: "change_video",
                  url: videoUrl,
                  title: res.title,
                  videoType: "direct"
                }
              })
            );
          }

          if (onLocalRoomStateUpdate) {
            onLocalRoomStateUpdate({
              videoUrl: videoUrl,
              videoTitle: res.title,
              videoType: "direct",
              isPlaying: false,
              currentTime: 0,
              lastUpdated: Date.now()
            });
          }
        } catch (e) {
          console.error("Upload response parse error:", e);
          setUploadError("Failed to parse server upload response.");
        }
      } else {
        try {
          const errRes = JSON.parse(xhr.responseText);
          setUploadError(errRes.error || "Failed to upload video.");
        } catch (e) {
          setUploadError("Failed to upload video to theater server.");
        }
      }
    };

    xhr.onerror = () => {
      setUploadProgress(null);
      setUploadError("Network connection error during file upload.");
    };

    xhr.send(formData);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const usersList = Object.values(roomState.users);

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-6 flex flex-col gap-6" id="party-room-layout">
      {/* 1. Header Row */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800 rounded-3xl p-4 shadow-xl" id="room-header-bar">
        <div className="flex items-center gap-3">
          <div className="scale-75 origin-left">
            <NiporaLogo size="sm" showTagline={false} />
          </div>
          <div className="h-8 w-[1px] bg-zinc-800 hidden md:block" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500 block">Room Code</span>
            <div className="flex items-center gap-1.5 bg-zinc-950 px-3.5 py-1.5 rounded-xl border border-zinc-800 font-mono text-xs font-bold text-red-500">
              <span>{roomState.roomId}</span>
              <button
                onClick={handleCopyRoomId}
                className="hover:text-white transition-colors"
                title="Copy Invite Link"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
              </button>
            </div>
          </div>
        </div>

        {/* Sync / Premium Badge indicators */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-2xl text-xs text-zinc-400">
            <Users className="w-4 h-4 text-red-500" />
            <span className="font-extrabold text-white">{usersList.length}/2</span>
            <span className="hidden sm:inline">Connected</span>
          </div>

          <div 
            onClick={() => {
              if (!roomState.isPremiumEnabled) setShowUpgradeModal(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold cursor-pointer transition-all border ${
              roomState.isPremiumEnabled 
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
            }`}
          >
            <Crown className={`w-4 h-4 ${roomState.isPremiumEnabled ? "text-amber-400 animate-pulse" : "text-zinc-500"}`} />
            <span>{roomState.isPremiumEnabled ? "Nipora Premium Active" : "Get Premium ₹99"}</span>
          </div>

          {onGoBackToHome && (
            <button
              onClick={onGoBackToHome}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-black bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white cursor-pointer transition-all border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:scale-105 active:scale-95"
              title="Leave Room and Go Back to Home Page"
            >
              <LogOut className="w-4 h-4" />
              <span>Exit Room</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Main content area: Left (Video Player & Controls), Right (Presence & Chat) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="room-content-grid">
        {/* Left Column: Player & File Upload */}
        <div className="lg:col-span-2 flex flex-col gap-6" id="player-and-controls-column">
          {/* Synced Movie Player */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-3 shadow-2xl relative" id="synced-player-block">
            <SyncedPlayer
              videoUrl={roomState.videoUrl}
              videoTitle={roomState.videoTitle}
              videoType={roomState.videoType}
              isPlaying={roomState.isPlaying}
              currentTime={roomState.currentTime}
              lastUpdated={roomState.lastUpdated}
              onSyncAction={onSyncAction}
              localTimeRef={localTimeRef}
              reactions={reactions}
              localFileBlobUrl={localFileBlobUrl}
              onSetLocalFileBlobUrl={setLocalFileBlobUrl}
            />
            {/* Displaying movie title nicely */}
            <div className="p-3 flex items-center justify-between text-xs border-t border-zinc-800 mt-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-red-600/10 text-red-400 border border-red-500/30 px-2 py-0.5 rounded uppercase font-black">
                  Now Playing
                </span>
                <span className="font-extrabold text-zinc-200 line-clamp-1">{roomState.videoTitle}</span>
              </div>
              <span className="text-zinc-500 text-[10px] font-mono">Synced Playhead</span>
            </div>
          </div>

          {/* Upload video file or Load URL section */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-5 md:p-6 flex flex-col gap-5" id="video-source-controls">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">Upload Your Video / Movie (FREE UP TO 5 GB & HD Support)</h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Upload up to 5 GB completely free with super-fast multi-threaded high definition (HD) streaming enabled for couples!
              </p>
            </div>

            {selectedFileForPrompt ? (
              <div className="bg-zinc-950/90 border border-zinc-800 rounded-2xl p-5 text-left flex flex-col gap-4" id="upload-choice-panel">
                <div>
                  <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded uppercase font-black font-mono">
                    Movie Selected: {selectedFileForPrompt.name} ({(selectedFileForPrompt.size / (1024*1024)).toFixed(1)} MB)
                  </span>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider mt-2">How would you like to stream this movie?</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Option 1: Instant Local Sync */}
                  <button
                    type="button"
                    onClick={() => {
                      handleInitiateLocalSync(selectedFileForPrompt);
                      setSelectedFileForPrompt(null);
                    }}
                    className="bg-purple-950/20 hover:bg-purple-950/40 border border-purple-500/30 hover:border-purple-500/80 rounded-xl p-4 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 text-purple-400 font-extrabold text-xs uppercase tracking-wider">
                      <Sparkles className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                      <span>Instant Local Sync (Best)</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                      ⚡ Zero upload, zero buffering, and uses 99% less data! Play instantly. Your partner will just select the same file on their device.
                    </p>
                  </button>

                  {/* Option 2: Server Upload */}
                  <button
                    type="button"
                    onClick={() => {
                      performDirectUpload(selectedFileForPrompt);
                      setSelectedFileForPrompt(null);
                    }}
                    className="bg-zinc-900/50 hover:bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 text-red-400 font-extrabold text-xs uppercase tracking-wider">
                      <Upload className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
                      <span>Upload to Server</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                      🍿 Upload to our theater server so your partner can stream directly. (Best for files under 100MB or fast connections).
                    </p>
                  </button>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedFileForPrompt(null)}
                    className="text-[10px] uppercase font-black tracking-wider text-zinc-500 hover:text-zinc-300 px-3 py-1.5 rounded-lg border border-zinc-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* Direct File Drag & Drop block */
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-800 hover:border-red-600/50 bg-zinc-950/40 hover:bg-zinc-950/90 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 relative"
                id="file-drop-zone"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUploadChange}
                  accept="video/*"
                  className="hidden"
                />
                <Upload className="w-8 h-8 text-red-500 animate-bounce" />
                <div className="text-xs">
                  <span className="text-white font-extrabold">Tap to select video file</span> or drag & drop here
                </div>
                <span className="text-[10px] text-zinc-500">MP4, MKV, WEBM, AVI support</span>

                {uploadProgress !== null && (
                  <div className="absolute inset-0 bg-neutral-950/95 rounded-2xl flex flex-col items-center justify-center p-4">
                    <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                    <span className="text-xs font-black mt-2 text-white">Uploading video... {uploadProgress}%</span>
                    <div className="w-full max-w-xs bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-red-600 to-amber-500 h-full transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-zinc-400 font-mono mt-1">Speed: {uploadSpeed}</span>
                  </div>
                )}
              </div>
            )}

            {uploadError && (
              <div className="bg-red-950/20 border border-red-500/30 text-red-300 rounded-xl px-4 py-2.5 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="h-[1px] bg-zinc-800 flex-1" />
              <span className="text-[10px] font-black uppercase text-zinc-500 font-mono">OR LOAD FROM STREAM</span>
              <div className="h-[1px] bg-zinc-800 flex-1" />
            </div>

            {/* Load custom URL form */}
            <form onSubmit={handleLoadCustomUrl} className="flex gap-2">
              <input
                type="url"
                required
                placeholder="Paste direct MP4 video link or YouTube video URL"
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                className="flex-1 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-red-600 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-white"
              />
              <button
                type="submit"
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-extrabold px-4 rounded-xl text-xs uppercase tracking-wide transition-colors whitespace-nowrap"
              >
                Load Stream
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Chat & Partner Presence & Cozy Call Lounge */}
        <div className="flex flex-col gap-6" id="chat-and-presence-column">
          {/* COZY COUPLE CALL LOUNGE */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-4 flex flex-col gap-3.5 relative overflow-hidden" id="cozy-call-lounge">
            {/* Glowing background highlights */}
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
              isInVoice ? "bg-green-500/10" : "bg-red-500/10"
            }`} />

            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-red-600/10 border border-red-500/20 text-red-400">
                  <Mic className="w-4 h-4 animate-pulse" />
                </span>
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Cozy Voice & Video Lounge</h3>
                  <span className="text-[9px] text-zinc-500 font-medium font-mono">Real-time sync talk</span>
                </div>
              </div>
              {isInVoice && (
                <span className="bg-green-500/10 border border-green-500/30 text-green-400 text-[8px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider animate-pulse">
                  ON CALL
                </span>
              )}
            </div>

            {/* CALL STATUS INDICATORS / SCREENS */}
            <AnimatePresence mode="wait">
              {incomingCallFrom ? (
                /* INCOMING CALL SCREEN */
                <motion.div
                  key="incoming"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-red-600/10 border border-red-500/30 rounded-2xl p-4 flex flex-col items-center text-center gap-3 animate-pulse"
                >
                  <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center relative">
                    <Heart className="w-6 h-6 text-red-400 animate-ping absolute" />
                    <Phone className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-white block uppercase tracking-wide">Incoming Cozy Call</span>
                    <p className="text-[11px] text-zinc-300 mt-0.5 font-medium">
                      <strong className="text-red-400">{incomingCallFrom}</strong> is calling you to talk!
                    </p>
                  </div>
                  <div className="flex gap-2 w-full mt-1.5">
                    <button
                      onClick={handleDeclineCall}
                      className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-extrabold text-[10px] uppercase py-2 rounded-xl border border-zinc-700 transition-colors cursor-pointer"
                    >
                      Decline
                    </button>
                    <button
                      onClick={handleAcceptCall}
                      className="flex-1 bg-green-500 hover:bg-green-400 text-neutral-950 font-black text-[10px] uppercase py-2 rounded-xl transition-all shadow-md shadow-green-500/10 cursor-pointer"
                    >
                      Answer Call
                    </button>
                  </div>
                </motion.div>
              ) : isCallingPartner ? (
                /* OUTGOING CALL SCREEN */
                <motion.div
                  key="calling"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-5 flex flex-col items-center text-center gap-3.5"
                >
                  <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600/30 opacity-75" />
                    <Phone className="w-5 h-5 text-red-500 animate-bounce" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest block animate-pulse">Ringing...</span>
                    <p className="text-xs text-white font-extrabold mt-1">Connecting with your partner</p>
                    <p className="text-[10px] text-zinc-500 leading-normal mt-0.5 max-w-[200px]">We are dialing your partner's theater chimes. Please wait...</p>
                  </div>
                  <button
                    onClick={() => setIsCallingPartner(false)}
                    className="bg-zinc-900 hover:bg-zinc-800 text-red-400 font-extrabold text-[9px] uppercase tracking-widest px-4 py-2 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
                  >
                    Cancel Call
                  </button>
                </motion.div>
              ) : isInVoice ? (
                /* ACTIVE COZY CALL CONTEXT */
                <motion.div
                  key="active-call"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-4"
                >
                  {/* Local and Partner Stream Display */}
                  <div className="grid grid-cols-2 gap-3" id="call-streams-grid">
                    {/* Local Feed */}
                    <div className="bg-zinc-950/80 rounded-2xl p-2.5 border border-zinc-800/80 flex flex-col items-center relative overflow-hidden group">
                      {isCameraOn ? (
                        <div className="w-full h-24 rounded-xl overflow-hidden relative bg-black">
                          <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover scale-x-[-1]"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-24 rounded-xl flex items-center justify-center bg-zinc-900 border border-zinc-800 relative">
                          {/* Pulsing rings matching local audio volume level */}
                          <div 
                            className="absolute inset-0 rounded-xl bg-red-600/5 transition-all duration-100 ease-out pointer-events-none" 
                            style={{ 
                              transform: `scale(${1 + (localMicLevel / 200)})`,
                              opacity: isMuted ? 0 : 0.3 + (localMicLevel / 150)
                            }}
                          />
                          <span className="text-3xl animate-bounce">{roomState.users[userId]?.avatar || "🦊"}</span>
                        </div>
                      )}
                      
                      {/* Name tag and Mic Amplitude bar */}
                      <div className="w-full mt-2 text-center">
                        <span className="text-[10px] font-black text-white block truncate">
                          You {isMuted && "(Muted)"}
                        </span>
                        
                        {/* Interactive dynamic sound volume indicator */}
                        {!isMuted && (
                          <div className="flex items-center justify-center gap-0.5 mt-1 h-2">
                            {[1, 2, 3, 4, 5].map((i) => {
                              const active = localMicLevel > (i * 15);
                              return (
                                <span
                                  key={i}
                                  className={`w-1 rounded-full transition-all duration-100 ${
                                    active ? "bg-green-500" : "bg-zinc-800"
                                  }`}
                                  style={{
                                    height: active ? `${Math.max(4, Math.floor(localMicLevel * (i/4)) % 10)}px` : "3px"
                                  }}
                                />
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Partner Feed */}
                    <div className="bg-zinc-950/80 rounded-2xl p-2.5 border border-zinc-800/80 flex flex-col items-center relative overflow-hidden group">
                      {(() => {
                        const partner = Object.values(roomState.users).find((u) => u.userId !== userId);
                        if (!partner) {
                          return (
                            <div className="w-full h-full flex flex-col items-center justify-center text-center p-3">
                              <Smartphone className="w-5 h-5 text-zinc-500 animate-bounce" />
                              <span className="text-[9px] text-zinc-500 font-bold uppercase mt-1">Calling...</span>
                            </div>
                          );
                        }

                        // Check if partner is also in voice call
                        const partnerInVoice = partner.isInVoice;
                        const partnerMuted = partner.isMuted;
                        const partnerCamera = partner.isCameraOn;

                        return (
                          <>
                            {partnerInVoice && partnerCamera ? (
                              <div className="w-full h-24 rounded-xl overflow-hidden bg-zinc-900 border border-red-500/30 flex items-center justify-center relative">
                                <div className="absolute inset-0 bg-red-950/30 backdrop-blur-[1px] flex flex-col items-center justify-center">
                                  <span className="text-2xl animate-pulse">🎥</span>
                                  <span className="text-[8px] text-red-400 font-mono mt-1 uppercase tracking-wider font-extrabold">LIVE STREAM</span>
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-24 rounded-xl flex items-center justify-center bg-zinc-900 border border-zinc-800 relative">
                                {/* Pulsing amplitude wave simulation for partner talking */}
                                {partnerInVoice && !partnerMuted && (
                                  <div className="absolute inset-0 rounded-xl bg-red-500/10 animate-pulse pointer-events-none" />
                                )}
                                <span className="text-3xl">{partner.avatar}</span>
                                {!partnerInVoice && (
                                  <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
                                    <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Dialing...</span>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="w-full mt-2 text-center">
                              <span className="text-[10px] font-black text-white block truncate">
                                {partner.username} {partnerMuted && "(Muted)"}
                              </span>

                              {partnerInVoice && !partnerMuted ? (
                                <div className="flex items-center justify-center gap-0.5 mt-1 h-2">
                                  {/* Simulated bouncy wave for active talking partner */}
                                  {[1, 2, 3, 4, 5].map((i) => (
                                    <span
                                      key={i}
                                      className="w-1 bg-red-500 rounded-full animate-pulse"
                                      style={{
                                        height: `${4 + Math.floor(Math.random() * 6)}px`,
                                        animationDelay: `${i * 120}ms`
                                      }}
                                    />
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[9px] text-zinc-500 font-bold block mt-0.5">
                                  {partnerInVoice ? (partnerMuted ? "Muted" : "Listening") : "Offline"}
                                </span>
                              )}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Call Controls Bar */}
                  <div className="flex items-center justify-center gap-3 bg-zinc-950/60 p-2 rounded-2xl border border-zinc-800/80 mt-1">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className={`p-2.5 rounded-xl border transition-all hover:scale-110 cursor-pointer ${
                        isMuted
                          ? "bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30"
                          : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                      }`}
                      title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                    >
                      {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => setIsCameraOn(!isCameraOn)}
                      className={`p-2.5 rounded-xl border transition-all hover:scale-110 cursor-pointer ${
                        isCameraOn
                          ? "bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30"
                          : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                      }`}
                      title={isCameraOn ? "Turn Camera Off" : "Turn Camera On"}
                    >
                      {isCameraOn ? <VideoOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={handleHangUp}
                      className="p-2.5 rounded-xl bg-red-600 hover:bg-red-500 border border-red-500 text-white hover:scale-110 transition-all cursor-pointer"
                      title="Hang up Cozy Call"
                    >
                      <PhoneOff className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* READY TO CALL STATE */
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center text-center p-3.5 bg-zinc-950/30 border border-zinc-800/80 rounded-2xl gap-3"
                >
                  <p className="text-[11px] text-zinc-400 leading-relaxed max-w-xs">
                    Watch movies while talking with your partner! Toggle voice and share your webcam for the ultimate cozy experience.
                  </p>
                  <button
                    onClick={handleStartCall}
                    className="bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all hover:scale-105 flex items-center gap-2 cursor-pointer shadow-lg shadow-red-600/10"
                  >
                    <Phone className="w-3.5 h-3.5 animate-pulse" />
                    <span>Start Cozy Call</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Couple Presence status widget */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-4 flex flex-col gap-3" id="couple-presence-card">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Couple Connection Status</span>
            <div className="flex flex-col gap-2">
              {usersList.map((usr) => (
                <div key={usr.userId} className="flex items-center justify-between bg-zinc-950/50 p-2.5 rounded-2xl border border-zinc-800/80">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{usr.avatar}</span>
                    <div>
                      <span className="text-xs font-black text-white block">{usr.username}</span>
                      <span className="text-[9px] text-zinc-500 font-mono">
                        {usr.userId === userId ? "You (Active)" : "Partner (Connected)"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                    <span className="text-[9px] text-green-400 uppercase font-black tracking-widest">ONLINE</span>
                  </div>
                </div>
              ))}
              {usersList.length < 2 && (
                <div className="p-3 border border-dashed border-zinc-800 rounded-2xl text-center text-zinc-500 text-xs flex flex-col items-center justify-center gap-1.5 py-5">
                  <Smartphone className="w-5 h-5 text-zinc-500 animate-pulse" />
                  <span>Waiting for partner...</span>
                  <button
                    onClick={handleCopyRoomId}
                    className="text-[10px] bg-red-600/15 hover:bg-red-600/35 text-red-400 px-3 py-1 rounded-lg border border-red-500/30 font-bold uppercase transition-colors"
                  >
                    Share Room Code
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Simple Watch Room Chat area */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-4 flex flex-col h-[350px] md:h-[400px]" id="couple-chat-widget">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3 shrink-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Couple Expression Lounge</span>
              <span className="text-[9px] font-mono text-zinc-500">Live chat synced</span>
            </div>

            {/* Chat list */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1" id="chat-messages-container">
              {roomState.chatHistory.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 max-w-[85%] ${
                    msg.userId === userId ? "ml-auto flex-row-reverse" : ""
                  } ${msg.userId === "system" ? "mx-auto max-w-full text-center" : ""}`}
                >
                  {msg.userId !== "system" && (
                    <span className="text-xl self-end mb-1">{msg.avatar}</span>
                  )}
                  <div className="flex flex-col gap-0.5">
                    {msg.userId !== "system" && (
                      <span 
                        className="text-[9px] font-bold"
                        style={{ color: msg.color || "#ffffff" }}
                      >
                        {msg.username}
                      </span>
                    )}
                    <div className={`px-3 py-2 text-xs rounded-2xl ${
                      msg.userId === "system"
                        ? "bg-zinc-950/80 border border-zinc-800 text-zinc-400 py-1"
                        : msg.userId === userId
                        ? "bg-red-600 text-white rounded-br-none"
                        : "bg-zinc-800 text-zinc-100 rounded-bl-none"
                    }`}>
                      <p>{msg.text}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>

            {/* Micro Expressions panel: Tap to send heart reactions */}
            <div className="flex items-center justify-center gap-2 py-2 border-t border-zinc-800/80 mt-3 shrink-0">
              {["💖", "🍿", "😂", "😢", "🔥", "👍"].map((emoji) => (
                <button
                  type="button"
                  key={emoji}
                  onClick={() => onTriggerReaction(emoji)}
                  className="text-xl p-1.5 hover:bg-zinc-800/80 rounded-xl hover:scale-125 transition-all"
                  title={`Trigger floating ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Chat entry form */}
            <form onSubmit={handleSendChatMessage} className="flex gap-2 pt-2 shrink-0">
              <input
                type="text"
                required
                placeholder="Say something to your partner..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-red-600 focus:outline-none rounded-xl px-3 py-2 text-xs text-white font-medium"
              />
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-500 text-white font-extrabold px-3.5 rounded-xl transition-colors flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Premium Subscription Details Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            id="room-upgrade-modal"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.99 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-6 relative overflow-hidden text-center shadow-2xl"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-amber-500 to-red-600" />
              
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
                <Crown className="w-6 h-6 text-amber-500" />
              </div>

              <h3 className="text-lg font-black text-white uppercase tracking-wider">
                Nipora Couple Premium (Free Promo)
              </h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                {selectedFileForUpload 
                  ? `Your movie file "${selectedFileForUpload.name}" is ${(selectedFileForUpload.size / (1024 * 1024 * 1024)).toFixed(2)} GB. Free rooms normally support up to 3 GB, but you can upgrade instantly for free!` 
                  : "Enjoy massive video upload support up to 4GB and premium server speeds!"}
              </p>

              {/* Plans Comparison */}
              <div className="mt-5 space-y-3">
                <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800 text-left flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-white block">Standard Free Plan</span>
                    <span className="text-[10px] text-zinc-400">Up to 3 GB direct movie upload</span>
                  </div>
                  <span className="text-xs font-black text-zinc-500 uppercase">Limit Exceeded</span>
                </div>

                <div className="bg-green-500/10 p-3.5 rounded-2xl border border-green-500/30 text-left flex justify-between items-center relative">
                  <div className="absolute -top-2.5 right-3 bg-green-500 text-neutral-950 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                    Active Promo
                  </div>
                  <div>
                    <span className="text-xs font-black text-green-400 block">3-Month Free Trial (₹0)</span>
                    <span className="text-[10px] text-zinc-300 font-medium">Up to 4 GB video upload, ultra-fast servers & no buffer!</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-zinc-400 line-through block">₹99</span>
                    <span className="text-sm font-black text-green-400">FREE</span>
                  </div>
                </div>
              </div>

              {/* Promo code confirmation block */}
              <div className="mt-5 bg-green-950/20 border border-green-500/30 rounded-2xl p-4 flex items-center gap-3 text-left">
                <div className="w-9 h-9 rounded-full bg-green-500/15 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-green-400 block uppercase tracking-wide">3-Month Free Trial Activated</span>
                  <p className="text-[10px] text-zinc-400 leading-tight mt-0.5">We have applied the 100% off coupon code <strong className="text-white font-mono">FREE3MONTHS</strong> automatically for your romantic movie nights!</p>
                </div>
              </div>

              {/* Quick unlock button */}
              <button
                type="button"
                onClick={handleTriggerUpgrade}
                className="w-full bg-green-500 hover:bg-green-400 text-neutral-950 font-black py-3.5 rounded-xl mt-5 hover:scale-[1.02] transition-all text-xs uppercase tracking-widest shadow-lg shadow-green-500/10 flex items-center justify-center gap-1.5"
              >
                <Crown className="w-4 h-4" />
                <span>Activate 3-Month Free Trial Now</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedFileForUpload(null);
                  setShowUpgradeModal(false);
                }}
                className="text-xs text-zinc-500 hover:text-zinc-300 mt-4 underline block mx-auto font-medium"
              >
                Cancel and use free up to 3 GB
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
