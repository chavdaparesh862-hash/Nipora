import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Users,
  Copy,
  Check,
  ChevronRight,
  Heart,
  Smartphone,
  Video,
  ExternalLink,
  Flame,
  Laugh,
  Angry,
  Sparkles,
  Zap,
  HandMetal,
  MessageSquare,
  AlertCircle,
  Lock,
  Coins,
  Upload,
  Loader2,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  MapPin,
  Crown,
  Compass,
  Activity,
  LogOut,
  HelpCircle,
  Smile,
  Calendar,
  Clock,
  Trophy,
  BookOpen,
  Plus,
  Award,
  Trash
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { RoomState, ChatMessage, FloatingReaction, PresetVideo, User } from "../types";
import SyncedPlayer from "./SyncedPlayer";
import NiporaLogo from "./NiporaLogo";

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
}

// Curated, 100% legal public domain and licensed streams
const PRESET_VIDEOS: PresetVideo[] = [
  {
    title: "Sintel (Fantasy Short Film)",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    description: "A beautiful, emotionally gripping cinematic story of a girl searching for her baby dragon companion.",
    category: "Fantasy / Adventure",
    duration: "08:48"
  },
  {
    title: "Big Buck Bunny (Classic Comedy)",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    description: "A giant, friendly rabbit takes on mischievous forest rodents in this beloved, funny animated short.",
    category: "Comedy / Animation",
    duration: "09:56"
  },
  {
    title: "Lofi Hip Hop Radio Study Beats 🎧",
    url: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
    description: "Relax, study, or cuddle together while listening to the world's most popular lofi chill beats.",
    category: "Music / Chillout 🎵",
    duration: "Live 🔴"
  },
  {
    title: "NASA Earth From Space Live feed 🌎",
    url: "https://www.youtube.com/watch?v=XBPjVzSo9YI",
    description: "Stunning, majestic live HD view of planet Earth from the International Space Station.",
    category: "Live Space Stream 🛰️",
    duration: "Live 🔴"
  },
  {
    title: "Tears of Steel (Sci-Fi CGI)",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    description: "Stunning dystopian sci-fi story featuring live-action actors surrounded by high-tech holographic robots.",
    category: "Sci-Fi / Action",
    duration: "12:14"
  },
  {
    title: "Elephants Dream (Abstract Sci-Fi)",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    description: "An evocative, abstract journey inside a surreal typing-and-piping machine of two explorers.",
    category: "Sci-Fi / CGI",
    duration: "10:53"
  }
];

function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Quick chat presets
const CHAT_PRESETS = [
  "Wow, did you see that?! 😮",
  "This is so sweet! ❤️",
  "Pause a second, grabbing popcorn! 🍿",
  "Haha oh my god 😂",
  "Ready to resume! 👍",
  "Aww I love this scene! 🥰"
];

// Emoji Reactions list
const REACTION_LIST = [
  { emoji: "❤️", label: "Love" },
  { emoji: "😂", label: "Haha" },
  { emoji: "😭", label: "Sad" },
  { emoji: "😮", label: "Wow" },
  { emoji: "👏", label: "Clap" },
  { emoji: "🔥", label: "Fire" }
];

// --- 🎮 Fun Lounge Game Constants ---
const QUIZ_QUESTIONS = [
  {
    question: "What is Sintel searching for in the fantasy short film?",
    options: ["A lost coin", "Her baby dragon companion", "A golden key", "Her long-lost brother"],
    answer: "Her baby dragon companion"
  },
  {
    question: "Which studio created the classic Big Buck Bunny?",
    options: ["Blender Foundation", "Pixar", "DreamWorks", "Disney"],
    answer: "Blender Foundation"
  },
  {
    question: "What type of robot features heavily in Tears of Steel?",
    options: ["Holographic dystopian robots", "Steam-powered giants", "Nano-microbes", "Cybernetic cats"],
    answer: "Holographic dystopian robots"
  }
];

const TRUTHS = [
  "What is your absolute favorite movie memory with me?",
  "If we were characters in Sintel, who would be Sintel and who would be the dragon?",
  "Which movie character reminds you most of me?",
  "What was your first impression of our watch parties?",
  "Where would you like to travel with me next? ✈️"
];

const DARES = [
  "Send a funny voice message describing the next scene!",
  "Send an expressive selfie right now in chat!",
  "Dramatically reenact the dialogue of the next character!",
  "Give me a virtual hug 🤗 using the gesture controls!",
  "Propose to me using dialogues from your favorite movie! 🌹"
];

// Calculate Haversine distance in km
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
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
  setUserLocation
}: PartyRoomProps) {
  const [chatText, setChatText] = useState("");
  const [customVideoUrl, setCustomVideoUrl] = useState("");
  const [customVideoTitle, setCustomVideoTitle] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"videos" | "couple" | "fun" | "timeline" | "premium" | "settings">("videos");

  // Video upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Local file playing states
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [localFileBlobUrl, setLocalFileBlobUrl] = useState<string>("");

  // Premium / Checkout modals
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumPaymentStep, setPremiumPaymentStep] = useState<"pay" | "processing" | "success">("pay");
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutAmount, setCheckoutAmount] = useState<number>(0);
  const [checkoutIsTicket, setCheckoutIsTicket] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"pay" | "processing" | "success">("pay");

  // Gesture alert triggers
  const [activeHug, setActiveHug] = useState<{ senderName: string; senderColor: string } | null>(null);
  const [activeNudge, setActiveNudge] = useState<{ senderName: string; senderColor: string } | null>(null);
  const [screenShake, setScreenShake] = useState(false);

  // --- 💕 Couple Mode States ---
  const [anniversaryDate, setAnniversaryDate] = useState(() => {
    return localStorage.getItem(`nipora_anniversary_${roomState.roomId}`) || "2025-11-20";
  });
  const [watchTime, setWatchTime] = useState(() => {
    const saved = localStorage.getItem(`nipora_watch_time_${roomState.roomId}`);
    return saved ? parseInt(saved, 10) : 327 * 3600 + 42 * 60; // default start at 327 hours, 42 minutes to match the requested timeline
  });
  const [missYouAlert, setMissYouAlert] = useState<{ senderName: string; senderAvatar: string; senderColor: string } | null>(null);
  const [sharedPlaylist, setSharedPlaylist] = useState<PresetVideo[]>(() => {
    const saved = localStorage.getItem(`nipora_playlist_${roomState.roomId}`);
    return saved ? JSON.parse(saved) : [];
  });

  // --- 🎮 Fun Lounge States ---
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [selectedTruth, setSelectedTruth] = useState("");
  const [selectedDare, setSelectedDare] = useState("");
  const [pollVotes, setPollVotes] = useState<{ [option: string]: number }>({
    "Sintel Part 2 🐉": 2,
    "Tears of Steel Redux 🤖": 1,
    "Anime Night 🌸": 3,
    "Classic Rom-Com 🍿": 0
  });

  // --- 📜 Memory Timeline States ---
  const [memories, setMemories] = useState(() => {
    const saved = localStorage.getItem(`nipora_memories_${roomState.roomId}`);
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "mem-1",
        date: "2026-06-15",
        movieName: "Sintel (Fantasy Short Film)",
        durationHours: 1.5,
        chatMemories: "We laughed when the dragon got lost, and cried when they reunited 🥺💖"
      },
      {
        id: "mem-2",
        date: "2026-05-20",
        movieName: "Tears of Steel (Sci-Fi)",
        durationHours: 2.2,
        chatMemories: "Remember naming the laser holograms after our pets! 😂"
      }
    ];
  });

  // --- 🎁 Premium Customizations ---
  const [selectedTheme, setSelectedTheme] = useState<"violet" | "black" | "cyan_glow" | "romantic_red">("violet");
  const [hdEnabled, setHdEnabled] = useState(false);
  const [animatedEmojis, setAnimatedEmojis] = useState(true);
  const [coupleBadge, setCoupleBadge] = useState(true);

  // --- 🔔 Dynamic Custom Notification States ---
  const [roomNotification, setRoomNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setRoomNotification(msg);
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.005, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (roomNotification) {
      const t = setTimeout(() => setRoomNotification(null), 3000);
      return () => clearTimeout(t);
    }
  }, [roomNotification]);

  const getAnniversaryDays = () => {
    try {
      const ann = new Date(anniversaryDate);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - ann.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return isNaN(diffDays) ? 327 : diffDays;
    } catch {
      return 327;
    }
  };

  const getThemeClass = () => {
    switch (selectedTheme) {
      case "black": return "bg-black shadow-none";
      case "cyan_glow": return "bg-neutral-950 shadow-[inset_0_0_100px_rgba(6,182,212,0.12)]";
      case "romantic_red": return "bg-[#050002] shadow-[inset_0_0_100px_rgba(244,63,94,0.12)]";
      case "violet":
      default:
        return "bg-[#020205] shadow-[inset_0_0_100px_rgba(168,85,247,0.12)]";
    }
  };

  // Ticking time watched together when movie is playing
  useEffect(() => {
    let timer: number;
    if (roomState.isPlaying) {
      timer = window.setInterval(() => {
        setWatchTime((prev) => {
          const next = prev + 1;
          localStorage.setItem(`nipora_watch_time_${roomState.roomId}`, next.toString());
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [roomState.isPlaying, roomState.roomId]);

  // Synchronize couple-specific real-time triggers over WebSocket
  useEffect(() => {
    if (!socket) return;
    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "couple_action") {
          const { action, payload, senderName, senderColor, senderAvatar } = message.payload;
          
          if (action === "miss_you") {
            setMissYouAlert({ senderName, senderAvatar, senderColor });
            // Heart-shaped audio frequency trigger
            try {
              const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
              if (AudioContext) {
                const ctx = new AudioContext();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(523.25, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.45);
                gain.gain.setValueAtTime(0.005, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.15);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(); osc.stop(ctx.currentTime + 0.45);
              }
            } catch (e) {}
            setTimeout(() => setMissYouAlert(null), 5000);
          } else if (action === "playlist_update") {
            setSharedPlaylist(payload);
          } else if (action === "poll_vote") {
            setPollVotes(prev => ({
              ...prev,
              [payload]: (prev[payload] || 0) + 1
            }));
          }
        }
      } catch (e) {}
    };
    socket.addEventListener("message", handleMessage);
    return () => socket.removeEventListener("message", handleMessage);
  }, [socket]);

  // Webcam stream reference
  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);

  // Chat scroll anchor
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Audio synthesize chords
  const playEnterRoomChime = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(130.81, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(261.63, ctx.currentTime + 1.0);
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 1.2);
    } catch (e) {}
  };

  const playHugSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(349.23, ctx.currentTime); // F4
      osc.frequency.setValueAtTime(440.00, ctx.currentTime + 0.1); // A4
      osc.frequency.setValueAtTime(523.25, ctx.currentTime + 0.2); // C5
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.7);
    } catch (e) {}
  };

  const playNudgeSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(220.00, ctx.currentTime);
      osc.frequency.setValueAtTime(110.00, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.4);
    } catch (e) {}
  };

  // Play chime on entering the room
  useEffect(() => {
    playEnterRoomChime();
  }, []);

  // Sync webcam state with HTML video element
  useEffect(() => {
    if (isCameraOn) {
      navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 }, audio: false })
        .then((stream) => {
          setWebcamStream(stream);
          if (webcamVideoRef.current) {
            webcamVideoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.warn("Could not access webcam:", err);
          setIsCameraOn(false);
        });
    } else {
      if (webcamStream) {
        webcamStream.getTracks().forEach((track) => track.stop());
        setWebcamStream(null);
      }
    }
    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isCameraOn]);

  // Keep chat scrolled down when a message comes in
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [roomState.chatHistory]);

  // Handle gestured hug or nudge triggers from WebSocket
  useEffect(() => {
    if (!socket) return;
    const handleGestureWs = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "hug_or_nudge") {
          const { actionType, senderId, senderName, senderColor } = message.payload;
          if (senderId !== userId) {
            if (actionType === "hug") {
              playHugSound();
              setActiveHug({ senderName, senderColor });
              setTimeout(() => setActiveHug(null), 6000);
            } else if (actionType === "nudge") {
              playNudgeSound();
              setActiveNudge({ senderName, senderColor });
              setScreenShake(true);
              setTimeout(() => {
                setActiveNudge(null);
                setScreenShake(false);
              }, 4000);
            }
          }
        }
      } catch (e) {}
    };
    socket.addEventListener("message", handleGestureWs);
    return () => {
      socket.removeEventListener("message", handleGestureWs);
    };
  }, [socket]);

  // Copy invitation link
  const handleCopyLink = () => {
    const inviteUrl = `${window.location.protocol}//${window.location.host}?room=${roomState.roomId}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Send standard chat message
  const handleSendMessage = (e?: React.FormEvent, textOverride?: string) => {
    if (e) e.preventDefault();
    const textToSend = textOverride || chatText.trim();
    if (!textToSend || !socket) return;

    socket.send(
      JSON.stringify({
        type: "chat_message",
        payload: { text: textToSend }
      })
    );

    if (!textOverride) setChatText("");
  };

  // Perform upload
  const performUploadFile = (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    const formData = new FormData();
    formData.append("video", file);
    formData.append("roomId", roomState.roomId);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload", true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
      }
    };

    xhr.onload = () => {
      setIsUploading(false);
      if (xhr.status === 200) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (socket) {
            socket.send(
              JSON.stringify({
                type: "video_control",
                payload: {
                  action: "change_video",
                  url: res.url,
                  title: res.title,
                  videoType: "direct"
                }
              })
            );
          }
        } catch (e) {
          setUploadError("Error parsing upload response.");
        }
      } else {
        setUploadError(`Upload failed: Server returned ${xhr.status}`);
      }
    };

    xhr.onerror = () => {
      setIsUploading(false);
      setUploadError("Network error occurred during video upload.");
    };

    xhr.send(formData);
  };

  const handleUploadFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setUploadError("Please select a valid video file (MP4, WebM, etc.)");
      return;
    }
    const freeLimit = 1024 * 1024 * 1024; // 1GB
    if (file.size > freeLimit && !isPremium) {
      setShowPremiumModal(true);
      return;
    }
    performUploadFile(file);
  };

  const handleConfirmPremiumPayment = () => {
    setPremiumPaymentStep("processing");
    setTimeout(() => {
      setPremiumPaymentStep("success");
      setIsPremium(true);
      setTimeout(() => {
        setShowPremiumModal(false);
        setPremiumPaymentStep("pay");
      }, 2000);
    }, 2200);
  };

  const handleInitiatePayment = (amount: number, isTicket: boolean) => {
    setCheckoutAmount(amount);
    setCheckoutIsTicket(isTicket);
    setCheckoutStep("pay");
    setShowCheckoutModal(true);
  };

  const handleConfirmCheckoutPayment = () => {
    setCheckoutStep("processing");
    setTimeout(() => {
      setCheckoutStep("success");
      setTimeout(() => {
        setShowCheckoutModal(false);
        setCheckoutStep("pay");
      }, 2000);
    }, 2200);
  };

  // Load custom video URL
  const handleLoadCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customVideoUrl || !socket) return;
    const isYt = !!getYouTubeId(customVideoUrl);
    socket.send(
      JSON.stringify({
        type: "video_control",
        payload: {
          action: "change_video",
          url: customVideoUrl,
          title: customVideoTitle.trim() || (isYt ? "Synced YouTube Video" : "Custom Link Movie"),
          videoType: isYt ? "youtube" : "direct"
        }
      })
    );
    setCustomVideoUrl("");
    setCustomVideoTitle("");
  };

  // Local file selection and playhead handling
  const handleLocalFileSelect = (file: File, isPassive: boolean = false) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      showToast("Please select a valid video file (MP4, MKV, WebM, etc.)");
      return;
    }
    
    // Revoke old URL to free browser memory
    if (localFileBlobUrl) {
      URL.revokeObjectURL(localFileBlobUrl);
    }
    
    const blobUrl = URL.createObjectURL(file);
    setLocalFile(file);
    setLocalFileBlobUrl(blobUrl);
    
    // Only broadcast change if we are initiating the video change (non-passive)
    if (!isPassive) {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: "video_control",
            payload: {
              action: "change_video",
              url: `local://${file.name}`,
              title: file.name,
              videoType: "direct"
            }
          })
        );
      }
    }
    showToast(`Loaded "${file.name}" locally! 🎬`);
  };

  // Keep local file in sync with room changes
  useEffect(() => {
    if (roomState.videoUrl && roomState.videoUrl.startsWith("local://")) {
      const expectedName = roomState.videoUrl.replace("local://", "");
      if (localFile && localFile.name !== expectedName) {
        setLocalFile(null);
        if (localFileBlobUrl) {
          URL.revokeObjectURL(localFileBlobUrl);
        }
        setLocalFileBlobUrl("");
      }
    }
  }, [roomState.videoUrl]);

  // Select preset curated movie
  const handleSelectPreset = (video: PresetVideo) => {
    if (!socket) return;
    const isYt = !!getYouTubeId(video.url);
    socket.send(
      JSON.stringify({
        type: "video_control",
        payload: {
          action: "change_video",
          url: video.url,
          title: video.title,
          videoType: isYt ? "youtube" : "direct"
        }
      })
    );
  };

  // Trigger gestures
  const sendGesture = (actionType: "hug" | "nudge") => {
    if (!socket) return;
    if (actionType === "hug") playHugSound();
    if (actionType === "nudge") playNudgeSound();
    socket.send(
      JSON.stringify({
        type: "hug_or_nudge",
        payload: { actionType }
      })
    );
  };

  // Current Users lists
  const myUser = roomState.users[userId];
  const partnerUser = Object.values(roomState.users).find((u) => u.userId !== userId);
  const isHost = roomState.hostId === userId;

  // Calculate Distance Meter details
  const getComputedDistance = () => {
    if (myUser?.latitude && myUser?.longitude && partnerUser?.latitude && partnerUser?.longitude) {
      const dist = calculateHaversineDistance(myUser.latitude, myUser.longitude, partnerUser.latitude, partnerUser.longitude);
      return `${dist.toFixed(0)} km`;
    }
    if (partnerUser) {
      // Elegant simulated distance if permissions are blocked or offline (Ahmedabad to Surat is ~230 km)
      return "230 km";
    }
    return null;
  };

  const distanceText = getComputedDistance();

  const isLocalVideo = roomState.videoUrl ? roomState.videoUrl.startsWith("local://") : false;
  const resolvedVideoUrl = isLocalVideo
    ? (localFileBlobUrl || "")
    : roomState.videoUrl;

  return (
    <div
      className={`min-h-screen ${getThemeClass()} text-white flex flex-col transition-all duration-300 relative ${
        screenShake ? "animate-[shake_0.5s_infinite]" : ""
      }`}
      id="cinema-theatre-root"
    >
      
      {/* Premium Cinematic Ambient Backdrop Gradients */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(220,38,38,0.09),transparent_60%),radial-gradient(circle_at_75%_75%,rgba(168,85,247,0.06),transparent_60%)] pointer-events-none z-0" />
      
      {/* 0. Dynamic Non-Blocking Room Toast Notification */}
      <AnimatePresence>
        {roomNotification && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-[100] max-w-sm bg-neutral-950/85 border border-purple-500/40 backdrop-blur-xl px-5 py-3.5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_20px_rgba(168,85,247,0.2)] flex items-center gap-3 pointer-events-auto"
            id="global-room-toast"
          >
            <div className="w-8 h-8 rounded-full bg-purple-950/50 border border-purple-500/30 flex items-center justify-center text-sm">
              👑
            </div>
            <div className="flex-1 text-left">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block">System Alert</span>
              <p className="text-xs font-extrabold text-zinc-100 mt-0.5">{roomNotification}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Full-screen virtual hug overlay alert */}
      <AnimatePresence>
        {activeHug && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-purple-950/85 backdrop-blur-md pointer-events-none text-center px-6"
            id="fullscreen-hug-overlay"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-8xl md:text-9xl filter drop-shadow-[0_0_35px_rgba(167,139,250,0.6)]"
            >
              🤗❤️🤗
            </motion.div>
            <h2 className="text-3xl md:text-5xl font-black mt-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-pink-100 to-blue-200 tracking-wide">
              VIRTUAL HUG RECEIVED!
            </h2>
            <p className="text-lg md:text-2xl mt-4 text-purple-200 font-medium">
              <span className="px-3.5 py-1 rounded-full bg-purple-900/40 border border-purple-500/50" style={{ color: activeHug.senderColor }}>
                {activeHug.senderName}
              </span>{" "}
              sends you a warm, cozy long-distance squeeze!
            </p>
            <p className="text-xs md:text-sm mt-8 text-purple-400 tracking-widest uppercase animate-pulse">
              You are closer than the distance suggests.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Top Banner alert for nudge */}
      <AnimatePresence>
        {activeNudge && (
          <motion.div
            initial={{ opacity: 0, y: -80 }}
            animate={{ opacity: 1, y: 16 }}
            exit={{ opacity: 0, y: -80 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-5 py-3 rounded-2xl shadow-[0_10px_30px_rgba(124,58,237,0.4)] border border-purple-400 font-bold max-w-sm w-[90%]"
            id="top-nudge-alert"
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center animate-bounce">
              👉
            </div>
            <div className="flex-1 text-sm text-left">
              <span style={{ color: activeNudge.senderColor }} className="font-extrabold">{activeNudge.senderName}</span> nudged you!
              <p className="text-xs font-normal text-purple-100">"Hey! Pay attention to the screen! 🍿"</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2.5 "Miss You" Alert Hearts Explosion Overlay */}
      <AnimatePresence>
        {missYouAlert && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md pointer-events-none text-center"
            id="miss-you-overlay"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.3, 1, 1.4, 1],
                rotate: [0, 5, -5, 5, 0]
              }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="text-9xl filter drop-shadow-[0_0_40px_rgba(236,72,153,0.7)]"
            >
              ❤️💑❤️
            </motion.div>
            <h2 className="text-4xl md:text-6xl font-black mt-8 text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-rose-100 to-purple-300 tracking-wider">
              SO MUCH LOVE RECEIVED!
            </h2>
            <p className="text-xl md:text-3xl mt-4 text-rose-200 font-extrabold px-6 py-2.5 rounded-full bg-rose-950/40 border border-rose-500/50">
              <span style={{ color: missYouAlert.senderColor }}>
                {missYouAlert.senderAvatar} {missYouAlert.senderName}
              </span>{" "}
              is tapping the screen & missing you dearly right now!
            </p>
            <div className="absolute inset-0 flex items-center justify-center -z-10 overflow-hidden">
              {[...Array(12)].map((_, i) => (
                <motion.span
                  key={i}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 0.5 }}
                  animate={{ 
                    x: (Math.random() - 0.5) * 500, 
                    y: (Math.random() - 0.5) * 500, 
                    opacity: 0,
                    scale: Math.random() * 2 + 1 
                  }}
                  transition={{ duration: 2.2, repeat: Infinity }}
                  className="absolute text-5xl"
                >
                  ❤️
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Top Header */}
      <header className="border-b border-red-950/40 bg-[#05040a]/95 backdrop-blur-md sticky top-0 z-30 px-4 md:px-6 py-2.5 flex items-center justify-between" id="room-header">
        
        {/* Left: Branding with official Nipora Logo */}
        <div className="flex items-center gap-2">
          <div className="scale-65 origin-left -my-4 h-12 flex items-center">
            <NiporaLogo size="sm" showTagline={false} />
          </div>
          <div className="h-6 w-[1px] bg-red-950/40 hidden sm:block mx-2" />
          <span className="text-[9px] bg-red-950/50 border border-red-500/20 text-red-500 font-black tracking-widest px-2.5 py-1 rounded-full uppercase hidden sm:block animate-pulse">
            🔴 Live watch
          </span>
        </div>

        {/* Center: Live Presence Header */}
        <div className="hidden md:flex items-center gap-2 bg-purple-950/20 border border-purple-900/30 px-3.5 py-1.5 rounded-full text-xs">
          <Activity className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
          <span className="font-medium text-purple-300">Synchronized Cinema Link</span>
        </div>

        {/* Right: Room Code & Quick Copy */}
        <div className="flex items-center gap-2">
          <a
            href="/api/download-zip"
            download="nipora-theatre-source.zip"
            title="Download Source Code ZIP"
            className="flex items-center justify-center w-9 h-9 sm:w-auto sm:px-3.5 py-2 rounded-xl bg-red-950/30 hover:bg-red-950/50 border border-red-500/20 hover:border-red-500/40 text-red-400 text-xs transition-all font-black uppercase cursor-pointer"
            id="room-download-zip-btn"
          >
            <span>📥</span>
            <span className="hidden sm:inline sm:ml-1.5">Source ZIP</span>
          </a>

          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-bold">INVITATION CODE</span>
            <span className="text-xs font-black text-purple-300 font-mono tracking-wider">{roomState.roomId}</span>
          </div>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 bg-purple-950/40 hover:bg-purple-900/40 border border-purple-900/50 text-white text-xs px-3.5 py-2 rounded-xl transition-all font-bold"
            id="copy-invite-btn"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-purple-300" />}
            <span>{copied ? "Copied Link!" : "Invite Friend"}</span>
          </button>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6" id="theatre-layout-grid">
        
        {/* Left Column: Screen, Live Chat & Movie Catalog (8 cols on lg) */}
        <div className="lg:col-span-8 flex flex-col gap-6" id="theatre-stage-column">
          
          {/* Movie Section at the Top */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-left">
                <Video className="w-4 h-4 text-purple-500 shrink-0" />
                <h2 className="text-sm font-black text-white tracking-wide truncate max-w-[280px] sm:max-w-md">
                  {roomState.videoTitle}
                </h2>
              </div>
              <span className="text-[10px] font-bold text-purple-300 bg-purple-950/40 border border-purple-900/40 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Direct Sync Link
              </span>
            </div>

            <div className="relative">
              <SyncedPlayer
                videoUrl={resolvedVideoUrl}
                isPlaying={roomState.isPlaying}
                currentTime={roomState.currentTime}
                lastUpdated={roomState.lastUpdated}
                onSyncAction={onSyncAction}
                localTimeRef={localTimeRef}
                reactions={reactions}
              />

              {/* Local File Selector Overlay when videoUrl is local:// but no local file loaded */}
              {isLocalVideo && !localFileBlobUrl && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-zinc-950/95 backdrop-blur-md p-6 text-center border border-purple-500/30 rounded-2xl">
                  <div className="w-16 h-16 rounded-full bg-purple-900/30 border border-purple-500/40 flex items-center justify-center text-3xl mb-4 animate-bounce">
                    🎬
                  </div>
                  <h3 className="text-sm font-black text-white mb-2 uppercase tracking-wide">
                    Partner is waiting for you!
                  </h3>
                  <p className="text-xs text-zinc-400 max-w-md mb-6 leading-relaxed">
                    Your partner loaded a local video file from their phone: <br />
                    <span className="text-purple-400 font-extrabold mt-1.5 block font-mono text-sm bg-purple-950/40 px-3 py-1.5 rounded-xl border border-purple-900/30">"{roomState.videoTitle}"</span>
                    <br />
                    To watch together in perfect 100% lag-free sync (with ZERO internet data upload), please choose the same file from your phone or PC!
                  </p>
                  <label className="cursor-pointer bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-extrabold text-[11px] tracking-widest px-6 py-3.5 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.35)] transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2">
                    <Upload className="w-4 h-4 shrink-0" />
                    <span>CHOOSE MATCHING VIDEO FILE</span>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLocalFileSelect(file, true);
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Chat Panel Directly Below the Movie ("Neeche live chat") */}
          <div className="bg-neutral-950/70 border border-purple-950/30 rounded-2xl overflow-hidden flex flex-col h-[400px]" id="chat-pane-under-player">
            
            {/* Header */}
            <div className="px-4 py-3 bg-neutral-900/40 border-b border-purple-950/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-400 shrink-0" />
                <h3 className="text-xs font-black text-zinc-300 uppercase tracking-widest">
                  Real-time Watch Chat
                </h3>
              </div>
              {partnerUser && (
                <span className="text-[10px] text-purple-400 font-semibold animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  Sync Connection Active
                </span>
              )}
            </div>

            {/* Chat list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col scrollbar-none" id="chat-feed-box">
              {roomState.chatHistory.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                  <div className="w-10 h-10 rounded-full bg-neutral-900 border border-purple-950 flex items-center justify-center text-lg mb-2">
                    💬
                  </div>
                  <h4 className="text-xs font-bold text-zinc-400">Your Private Sync Chat</h4>
                  <p className="text-[10px] text-zinc-500 mt-1 max-w-xs">
                    Messages are fully locked-in-sync. Send a whisper to start!
                  </p>
                </div>
              ) : (
                roomState.chatHistory.map((msg) => {
                  const isMyMsg = msg.userId === userId;
                  const isSys = msg.userId === "system";

                  if (isSys) {
                    return (
                      <div key={msg.id} className="flex justify-center my-1" id={`msg-${msg.id}`}>
                        <span className="text-[9px] text-zinc-500 bg-neutral-900/80 border border-purple-950/30 px-3 py-0.5 rounded-full text-center font-mono">
                          {msg.avatar} {msg.text}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2 max-w-[85%] ${isMyMsg ? "self-end flex-row-reverse text-right" : "self-start text-left"}`}
                      id={`msg-${msg.id}`}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs border bg-neutral-900 font-bold"
                        style={{ borderColor: msg.color }}
                      >
                        {msg.avatar}
                      </div>

                      <div className="flex flex-col">
                        <span className="text-[9px] text-zinc-500 mb-0.5 font-bold">
                          <span style={{ color: msg.color }}>{msg.username}</span> • {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <div
                          className={`px-3 py-1.5 text-xs rounded-2xl leading-relaxed whitespace-pre-wrap ${
                            isMyMsg
                              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-none shadow-md"
                              : "bg-neutral-900 text-zinc-100 rounded-tl-none border border-purple-950/30"
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick pre-filled chat phrases */}
            <div className="px-3 py-2 bg-neutral-950/40 border-t border-purple-950/30 flex gap-1.5 overflow-x-auto scrollbar-none shrink-0" id="chat-presets">
              {CHAT_PRESETS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => handleSendMessage(undefined, preset)}
                  className="text-[10px] font-bold text-zinc-400 hover:text-white bg-neutral-900 hover:bg-neutral-850 border border-purple-950/50 hover:border-purple-900/50 px-3 py-1 rounded-full whitespace-nowrap transition"
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <div className="p-3 border-t border-purple-950/30 bg-neutral-950 shrink-0" id="chat-input-bar">
              <form onSubmit={(e) => handleSendMessage(e)} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a lovely synchronized message..."
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  maxLength={180}
                  className="flex-1 bg-neutral-900 text-xs border border-purple-950/40 focus:outline-none focus:border-purple-600 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600"
                />
                <button
                  type="submit"
                  disabled={!chatText.trim()}
                  className="w-9 h-9 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 disabled:opacity-30 text-white flex items-center justify-center transition shrink-0 shadow-md active:scale-95"
                >
                  <Send className="w-4 h-4 fill-current" />
                </button>
              </form>
            </div>
          </div>

          {/* Expanded Premium Interactivity Deck (6-Tab control panel) */}
          <div className="bg-neutral-950/80 border border-purple-500/20 rounded-2xl overflow-hidden flex flex-col shadow-[0_0_30px_rgba(168,85,247,0.1)] relative" id="media-manager-panel">
            
            {/* Horizontal Scrollable Premium Tabs Deck */}
            <div className="flex border-b border-purple-950/40 bg-neutral-900/40 overflow-x-auto scrollbar-none" id="premium-tab-deck">
              <button
                type="button"
                onClick={() => setActiveTab("videos")}
                className={`flex-1 min-w-[120px] px-4 py-3 text-[10px] font-black tracking-wider uppercase border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "videos" ? "border-purple-500 text-purple-300 bg-purple-950/10" : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                🎬 Movies
              </button>
              
              <button
                type="button"
                onClick={() => setActiveTab("couple")}
                className={`flex-1 min-w-[120px] px-4 py-3 text-[10px] font-black tracking-wider uppercase border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "couple" ? "border-pink-500 text-pink-300 bg-pink-950/10" : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                💖 Couple Mode
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("fun")}
                className={`flex-1 min-w-[120px] px-4 py-3 text-[10px] font-black tracking-wider uppercase border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "fun" ? "border-cyan-500 text-cyan-300 bg-cyan-950/10" : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                🎮 Fun Lounge
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("timeline")}
                className={`flex-1 min-w-[120px] px-4 py-3 text-[10px] font-black tracking-wider uppercase border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "timeline" ? "border-violet-500 text-violet-300 bg-violet-950/10" : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                📜 Memories
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("premium")}
                className={`flex-1 min-w-[120px] px-4 py-3 text-[10px] font-black tracking-wider uppercase border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "premium" ? "border-amber-500 text-amber-300 bg-amber-950/10" : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                👑 Premium Club
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("settings")}
                className={`flex-1 min-w-[120px] px-4 py-3 text-[10px] font-black tracking-wider uppercase border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "settings" ? "border-zinc-500 text-zinc-300 bg-zinc-950/10" : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                💰 UPI & Support
              </button>
            </div>

            <div className="p-4 md:p-5 text-left">
              
              {/* 1. Curated Movies Tab */}
              {activeTab === "videos" && (
                <div className="flex flex-col gap-5 text-left" id="presets-videos-tab">
                  
                  {/* Direct Local Video File Sync & Cloud Server Upload Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-purple-950/40 pb-5">
                    
                    {/* Option 1: Play Local File (Instant & Offline - Zero MB Internet Upload) */}
                    <div className="bg-gradient-to-br from-purple-950/30 to-neutral-900/50 border border-purple-500/20 p-4 rounded-2xl flex flex-col justify-between gap-3 shadow-[inset_0_0_15px_rgba(168,85,247,0.05)]">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-8 h-8 rounded-full bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-sm">
                            📱
                          </div>
                          <h4 className="text-xs font-black text-white uppercase tracking-wider">Play Local Video (Zero Data Cost)</h4>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          Apne phone ya computer se direct video/movie file select karein. 
                          <strong className="text-purple-400"> ZERO MB internet data upload!</strong> Bas apne partner ko bolein ki woh bhi same file select karein, aur aapka watch session 100% perfect sync mein chalega!
                        </p>
                      </div>
                      
                      <div>
                        {!isHost ? (
                          <div className="text-[10px] text-zinc-500 font-bold bg-zinc-950/40 p-2.5 rounded-xl flex items-center gap-2 border border-zinc-900">
                            <Lock className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                            <span>Only host can select local file</span>
                          </div>
                        ) : (
                          <label className="cursor-pointer bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-[10px] tracking-widest px-4 py-3 rounded-xl transition duration-200 shadow-md text-center block w-full uppercase">
                            📁 Select File from Phone
                            <input
                              type="file"
                              accept="video/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleLocalFileSelect(file);
                              }}
                              className="hidden"
                            />
                          </label>
                        )}
                        {localFile && (
                          <div className="mt-2 text-[10px] text-purple-300 font-mono bg-purple-950/30 border border-purple-900/30 p-2 rounded-xl flex items-center justify-between">
                            <span className="truncate max-w-[150px]">Active local: {localFile.name}</span>
                            <button 
                              onClick={() => {
                                setLocalFile(null);
                                setLocalFileBlobUrl("");
                              }}
                              className="text-zinc-500 hover:text-white font-bold text-[9px] uppercase tracking-wider shrink-0"
                            >
                              Reset
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Option 2: Server File Upload & Stream */}
                    <div className="bg-gradient-to-br from-blue-950/30 to-neutral-900/50 border border-blue-500/20 p-4 rounded-2xl flex flex-col justify-between gap-3 shadow-[inset_0_0_15px_rgba(59,130,246,0.05)]">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-8 h-8 rounded-full bg-blue-900/40 border border-blue-500/30 flex items-center justify-center text-sm">
                            ☁️
                          </div>
                          <h4 className="text-xs font-black text-white uppercase tracking-wider">Upload to Server (Online Stream)</h4>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          Video file ko cloud/server par upload karein taaki aap dono use online stream kar sakein. Free accounts support up to 1GB uploads, Premium rooms support up to 4GB.
                        </p>
                      </div>

                      <div>
                        {!isHost ? (
                          <div className="text-[10px] text-zinc-500 font-bold bg-zinc-950/40 p-2.5 rounded-xl flex items-center gap-2 border border-zinc-900">
                            <Lock className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                            <span>Only host can upload videos</span>
                          </div>
                        ) : isUploading ? (
                          <div className="flex flex-col gap-2 bg-neutral-900/80 p-2.5 rounded-xl border border-blue-950">
                            <div className="flex justify-between text-[10px] font-bold text-blue-400">
                              <span className="animate-pulse">Uploading movie...</span>
                              <span>{uploadProgress}%</span>
                            </div>
                            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                            </div>
                          </div>
                        ) : (
                          <label className="cursor-pointer bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-extrabold text-[10px] tracking-widest px-4 py-3 rounded-xl transition duration-200 shadow-md text-center block w-full uppercase">
                            ☁️ Upload Movie File
                            <input
                              type="file"
                              accept="video/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUploadFile(file);
                              }}
                              className="hidden"
                            />
                          </label>
                        )}
                        {uploadError && (
                          <div className="mt-2 text-[9px] text-rose-400 font-semibold bg-rose-950/20 border border-rose-900/30 p-2 rounded-xl">
                            ⚠️ {uploadError}
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Option 3: Load Custom Stream Link or YouTube URL */}
                  <div className="bg-neutral-900/30 border border-purple-950/60 p-4 rounded-2xl flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-black text-zinc-200 uppercase tracking-widest">Load Online Stream or YouTube Link</span>
                    </div>
                    
                    <form onSubmit={handleLoadCustomUrl} className="flex flex-col md:flex-row gap-2.5">
                      <input
                        type="text"
                        placeholder="Video Title (optional)"
                        value={customVideoTitle}
                        onChange={(e) => setCustomVideoTitle(e.target.value)}
                        disabled={!isHost}
                        className="flex-1 bg-neutral-950 border border-purple-950/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-600 disabled:opacity-40"
                      />
                      <input
                        type="text"
                        placeholder="Paste direct .mp4 link or YouTube URL..."
                        value={customVideoUrl}
                        onChange={(e) => setCustomVideoUrl(e.target.value)}
                        disabled={!isHost}
                        className="flex-[2] bg-neutral-950 border border-purple-950/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-600 disabled:opacity-40"
                      />
                      <button
                        type="submit"
                        disabled={!isHost || !customVideoUrl}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 disabled:opacity-30 text-white font-extrabold text-[10px] uppercase tracking-widest px-5 py-2.5 rounded-xl transition duration-200 shrink-0"
                      >
                        Load Video
                      </button>
                    </form>
                    {!isHost && (
                      <p className="text-[10px] text-zinc-600 flex items-center gap-1.5 mt-1">
                        <Lock className="w-3 h-3 text-zinc-700" /> Only room host can load custom streaming links
                      </p>
                    )}
                  </div>

                  {/* Section Title: Curated Preset Videos */}
                  <div className="flex flex-col gap-1 mt-2">
                    <h3 className="text-xs font-extrabold text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
                      <span>🍿</span> Curated Public-Domain Catalog
                    </h3>
                    <p className="text-[10px] text-zinc-500">Quick play classic indie films and atmospheric live feeds</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {PRESET_VIDEOS.map((video) => {
                      const isCurrent = roomState.videoUrl === video.url;
                      return (
                        <div
                          key={video.url}
                          onClick={() => isHost && handleSelectPreset(video)}
                          className={`group/item p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                            isCurrent
                              ? "bg-purple-950/20 border-purple-500/60 shadow-[0_0_15px_rgba(124,58,237,0.15)]"
                              : !isHost
                                ? "bg-neutral-900/30 border-purple-950/20 opacity-60 cursor-not-allowed"
                                : "bg-neutral-900/60 border-purple-950/50 hover:border-purple-500/30 hover:bg-neutral-900 cursor-pointer"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest font-mono">
                                {video.category}
                              </span>
                              <span className="text-[10px] text-zinc-500 font-mono">{video.duration}</span>
                            </div>
                            <h4 className="text-xs font-extrabold text-zinc-200 group-hover/item:text-purple-400 transition-colors">
                              {video.title}
                            </h4>
                            <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                              {video.description}
                            </p>
                          </div>
                          <div className="mt-3 flex items-center justify-between border-t border-purple-950/30 pt-2 text-[9px] font-bold">
                            {isCurrent ? (
                              <span className="text-purple-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
                                Synced Onscreen
                              </span>
                            ) : !isHost ? (
                              <span className="text-zinc-600 flex items-center gap-1">
                                <Lock className="w-3 h-3" /> Host Controlled
                              </span>
                            ) : (
                              <span className="text-zinc-500 group-hover/item:text-purple-300 transition-colors flex items-center gap-1">
                                Play Stream <ChevronRight className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. 💕 Couple Mode Tab */}
              {activeTab === "couple" && (
                <div className="flex flex-col gap-5 text-left" id="couple-mode-tab">
                  
                  {/* Anniversary Days counter */}
                  <div className="bg-gradient-to-r from-pink-950/20 to-purple-950/20 border border-pink-500/25 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-pink-900/30 border border-pink-500/40 flex items-center justify-center text-lg shrink-0">
                        💕
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-[10px] text-pink-400 uppercase tracking-widest font-bold">DAYS OF TOGETHERNESS</span>
                        <span className="text-sm md:text-base font-black text-white tracking-wide">Day {getAnniversaryDays()} Together</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-neutral-900/60 border border-pink-950 p-1.5 rounded-xl shrink-0">
                      <Calendar className="w-3.5 h-3.5 text-pink-400" />
                      <input
                        type="date"
                        value={anniversaryDate}
                        onChange={(e) => {
                          setAnniversaryDate(e.target.value);
                          localStorage.setItem(`nipora_anniversary_${roomState.roomId}`, e.target.value);
                        }}
                        className="bg-transparent text-[11px] text-zinc-300 font-bold focus:outline-none focus:text-white cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Kitna Time Saath Watch Kiya */}
                  <div className="bg-neutral-900/40 border border-purple-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-900/30 border border-purple-500/40 flex items-center justify-center text-lg shrink-0 animate-pulse">
                        ⏱️
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-[10px] text-purple-400 uppercase tracking-widest font-bold font-mono">TOTAL WATCHED SECONDS (ACCUMULATING)</span>
                        <span className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 tracking-wider font-mono">
                          {Math.floor(watchTime / 3600)}h {Math.floor((watchTime % 3600) / 60)}m {watchTime % 60}s
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Relationship Badge</span>
                      <span className="text-xs font-black text-purple-300 flex items-center gap-1 mt-0.5 justify-end">
                        <Award className="w-3.5 h-3.5 text-amber-400" /> LEVEL 4 Soulmates
                      </span>
                    </div>
                  </div>

                  {/* "Miss You" Buzzer button */}
                  <div className="p-4 rounded-2xl bg-[#0a020b]/80 border border-rose-500/20 text-center flex flex-col gap-3">
                    <p className="text-[11px] text-zinc-400 max-w-md mx-auto leading-relaxed">
                      Tap the <strong className="text-rose-400">"Miss You"</strong> buzzer to trigger a synchronized heartbeat vibration, a screen overlay, and full-screen visual heart particles on your partner's active window!
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (!socket) return;
                        socket.send(JSON.stringify({
                          type: "couple_action",
                          payload: { action: "miss_you" }
                        }));
                        socket.send(JSON.stringify({
                          type: "chat_message",
                          payload: { text: "💖 I'm missing you so much right now! Sent a heart buzz! 🥰" }
                        }));
                        showToast("Heart buzz sent successfully! 💖");
                      }}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 hover:opacity-95 text-white font-black text-xs tracking-widest shadow-[0_0_20px_rgba(244,63,94,0.3)] transition transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 animate-pulse"
                    >
                      <Heart className="w-4 h-4 fill-current text-white shrink-0 animate-bounce" />
                      <span>TAP TO SEND "MISS YOU" HEART ❤️</span>
                    </button>
                  </div>

                  {/* Shared playlist */}
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between border-b border-purple-950/60 pb-2">
                      <h4 className="text-xs font-extrabold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                        <span>💞</span> Couples shared playlist
                      </h4>
                      <span className="text-[10px] text-pink-400 font-bold">Synchronized list</span>
                    </div>

                    {sharedPlaylist.length === 0 ? (
                      <div className="py-8 text-center border border-dashed border-purple-950/40 rounded-xl bg-neutral-900/10 flex flex-col items-center justify-center p-4">
                        <span className="text-2xl mb-1">🍿</span>
                        <h5 className="text-xs font-bold text-zinc-400">Your Shared Playlist is Empty</h5>
                        <p className="text-[10px] text-zinc-600 mt-0.5">Sync any movie, YouTube stream, or direct link below!</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-1">
                        {sharedPlaylist.map((video) => {
                          const isCurrent = roomState.videoUrl === video.url;
                          return (
                            <div
                              key={video.url}
                              className={`p-3 rounded-xl border transition-all flex flex-col justify-between text-left relative group/playlist ${
                                isCurrent
                                  ? "bg-rose-950/20 border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.15)]"
                                  : !isHost
                                    ? "bg-neutral-900/30 border-purple-950/20 opacity-65"
                                    : "bg-neutral-900/60 border-purple-950/50 hover:border-rose-500/30 cursor-pointer"
                              }`}
                            >
                              <div className={isHost ? "cursor-pointer" : ""} onClick={() => isHost && handleSelectPreset(video)}>
                                <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">{video.category || "Couple Favorite"}</span>
                                <h5 className="text-xs font-bold text-zinc-200 truncate mt-1 pr-6">{video.title}</h5>
                              </div>

                              {/* Delete button (only for Host to synchronize playlist edits) */}
                              {isHost && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const updated = sharedPlaylist.filter((v) => v.url !== video.url);
                                    setSharedPlaylist(updated);
                                    localStorage.setItem(`nipora_playlist_${roomState.roomId}`, JSON.stringify(updated));
                                    if (socket && socket.readyState === WebSocket.OPEN) {
                                      socket.send(JSON.stringify({
                                        type: "couple_action",
                                        payload: {
                                          action: "playlist_update",
                                          payload: updated
                                        }
                                      }));
                                    }
                                    showToast("Movie removed from playlist! 🗑️");
                                  }}
                                  className="absolute top-2.5 right-2.5 p-1 text-zinc-600 hover:text-rose-400 rounded-lg hover:bg-rose-950/20 transition opacity-0 group-hover/playlist:opacity-100"
                                  title="Remove movie"
                                >
                                  <Trash className="w-3.5 h-3.5 shrink-0" />
                                </button>
                              )}

                              <div className={`mt-2 text-[9px] text-zinc-500 flex items-center justify-between border-t border-purple-950/20 pt-1.5 ${isHost ? "cursor-pointer" : ""}`} onClick={() => isHost && handleSelectPreset(video)}>
                                <span>{isCurrent ? "🎥 Sync Active" : !isHost ? "Host Locked" : "Play Stream"}</span>
                                <span className="font-mono">{video.duration}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add stream form */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);
                        const title = (fd.get("title") as string)?.trim();
                        const url = (fd.get("url") as string)?.trim();
                        if (title && url) {
                          const newItem: PresetVideo = {
                            title,
                            url,
                            description: "Custom couples shared link",
                            category: "Shared Fav",
                            duration: "Custom duration"
                          };
                          const updated = [...sharedPlaylist, newItem];
                          setSharedPlaylist(updated);
                          localStorage.setItem(`nipora_playlist_${roomState.roomId}`, JSON.stringify(updated));
                          
                          if (socket && socket.readyState === WebSocket.OPEN) {
                            socket.send(JSON.stringify({
                              type: "couple_action",
                              payload: {
                                action: "playlist_update",
                                payload: updated
                              }
                            }));
                          }
                          e.currentTarget.reset();
                          showToast("Movie added and synchronized! 🎬");
                        }
                      }}
                      className="mt-2 bg-neutral-900/50 border border-purple-950 p-3.5 rounded-xl flex flex-col gap-2.5"
                    >
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Sync new movie stream to your shared playlist</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          name="title"
                          type="text"
                          placeholder="Movie Title"
                          required
                          className="bg-neutral-950 border border-purple-950 text-[11px] text-white rounded-lg p-2.5 focus:outline-none focus:border-purple-600"
                        />
                        <input
                          name="url"
                          type="url"
                          placeholder="Direct MP4/WebM URL Link"
                          required
                          className="bg-neutral-950 border border-purple-950 text-[11px] text-white rounded-lg p-2.5 focus:outline-none focus:border-purple-600"
                        />
                      </div>
                      <button
                        type="submit"
                        className="self-start bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-extrabold uppercase tracking-widest px-4 py-2 rounded-lg transition"
                      >
                        + Add Stream
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* 3. 🎮 Fun Lounge Tab */}
              {activeTab === "fun" && (
                <div className="flex flex-col gap-5 text-left" id="fun-lounge-tab">
                  
                  {/* Trivia Quiz */}
                  <div className="bg-neutral-900/60 border border-purple-950 p-4 rounded-2xl flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-extrabold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-yellow-500" /> Movie Trivia Quiz
                      </h4>
                      <span className="text-[10px] font-bold text-purple-400">Score: {quizScore} / {QUIZ_QUESTIONS.length}</span>
                    </div>

                    {!quizFinished ? (
                      <div className="flex flex-col gap-2">
                        <p className="text-xs font-bold text-zinc-300">
                          Question {quizIndex + 1}: {QUIZ_QUESTIONS[quizIndex].question}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                          {QUIZ_QUESTIONS[quizIndex].options.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                const isCorrect = opt === QUIZ_QUESTIONS[quizIndex].answer;
                                if (isCorrect) {
                                  setQuizScore(s => s + 1);
                                }
                                
                                // Broadcast choice in chat
                                if (socket) {
                                  socket.send(JSON.stringify({
                                    type: "chat_message",
                                    payload: {
                                      text: `🎮 Answered Quiz: Selected "${opt}" (${isCorrect ? "✅ Correct" : "❌ Wrong"})`
                                    }
                                  }));
                                }

                                if (quizIndex < QUIZ_QUESTIONS.length - 1) {
                                  setQuizIndex(i => i + 1);
                                } else {
                                  setQuizFinished(true);
                                }
                              }}
                              className="p-2.5 text-[11px] font-semibold text-left text-zinc-300 hover:text-white bg-neutral-950 hover:bg-neutral-850 border border-purple-950/80 rounded-xl transition duration-200"
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-3 bg-purple-950/20 rounded-xl border border-purple-500/20">
                        <span className="text-2xl">🎉🏆🎉</span>
                        <h5 className="text-xs font-black text-white mt-1">Trivia Quiz Finished!</h5>
                        <p className="text-[11px] text-zinc-400 mt-1">You scored {quizScore} out of {QUIZ_QUESTIONS.length} points!</p>
                        <button
                          type="button"
                          onClick={() => {
                            setQuizIndex(0);
                            setQuizScore(0);
                            setQuizFinished(false);
                          }}
                          className="mt-2.5 bg-purple-600 hover:bg-purple-700 text-white text-[9px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-lg"
                        >
                          Reset Quiz
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Truth and dare cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-neutral-900/60 border border-purple-950 p-4 rounded-2xl text-center flex flex-col justify-between min-h-[160px]">
                      <div>
                        <h4 className="text-xs font-extrabold text-purple-400 uppercase tracking-widest mb-1.5">Truth Card</h4>
                        <p className="text-[11px] font-medium text-zinc-300 italic min-h-[50px] flex items-center justify-center px-2">
                          {selectedTruth || "Click reveal to get a sweet romantic watch truth!"}
                        </p>
                      </div>
                      <div className="flex gap-1.5 mt-3">
                        <button
                          type="button"
                          onClick={() => {
                            const rand = TRUTHS[Math.floor(Math.random() * TRUTHS.length)];
                            setSelectedTruth(rand);
                          }}
                          className="flex-1 py-1.5 bg-neutral-950 hover:bg-neutral-900 border border-purple-950 text-purple-300 hover:text-white rounded-lg text-[10px] font-bold uppercase transition"
                        >
                          Reveal Truth
                        </button>
                        {selectedTruth && (
                          <button
                            type="button"
                            onClick={() => {
                              if (socket) {
                                socket.send(JSON.stringify({
                                  type: "chat_message",
                                  payload: { text: `🤔 [TRUTH PROMPT]: "${selectedTruth}"` }
                                }));
                              }
                            }}
                            className="px-2 bg-purple-900/40 text-purple-300 rounded-lg border border-purple-500/20 text-[10px] font-bold"
                            title="Send to chat"
                          >
                            💬 Sync
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="bg-neutral-900/60 border border-purple-950 p-4 rounded-2xl text-center flex flex-col justify-between min-h-[160px]">
                      <div>
                        <h4 className="text-xs font-extrabold text-cyan-400 uppercase tracking-widest mb-1.5">Dare Card</h4>
                        <p className="text-[11px] font-medium text-zinc-300 italic min-h-[50px] flex items-center justify-center px-2">
                          {selectedDare || "Click reveal to get a playful couple stream dare!"}
                        </p>
                      </div>
                      <div className="flex gap-1.5 mt-3">
                        <button
                          type="button"
                          onClick={() => {
                            const rand = DARES[Math.floor(Math.random() * DARES.length)];
                            setSelectedDare(rand);
                          }}
                          className="flex-1 py-1.5 bg-neutral-950 hover:bg-neutral-900 border border-purple-950 text-cyan-300 hover:text-white rounded-lg text-[10px] font-bold uppercase transition"
                        >
                          Reveal Dare
                        </button>
                        {selectedDare && (
                          <button
                            type="button"
                            onClick={() => {
                              if (socket) {
                                socket.send(JSON.stringify({
                                  type: "chat_message",
                                  payload: { text: `🔥 [DARE PROMPT]: "${selectedDare}"` }
                                }));
                              }
                            }}
                            className="px-2 bg-cyan-900/40 text-cyan-300 rounded-lg border border-cyan-500/20 text-[10px] font-bold"
                            title="Send to chat"
                          >
                            💬 Sync
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Synchronized next movie poll */}
                  <div className="bg-neutral-900/60 border border-purple-950 p-4 rounded-2xl">
                    <h4 className="text-xs font-extrabold text-zinc-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      📊 Poll: Agli movie kaunsi dekhein?
                    </h4>
                    <div className="space-y-2.5">
                      {Object.entries(pollVotes).map(([option, votes]) => {
                        const total = (Object.values(pollVotes) as number[]).reduce((a, b) => a + b, 0) || 1;
                        const pct = Math.round(((votes as number) / total) * 100);
                        return (
                          <div key={option} className="flex flex-col gap-1">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-semibold text-zinc-300">{option}</span>
                              <span className="text-zinc-500 font-mono font-bold">{votes} votes ({pct}%)</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-neutral-950 overflow-hidden relative border border-purple-950/50">
                              <div className="h-full bg-gradient-to-r from-purple-600 to-cyan-500" style={{ width: `${pct}%` }} />
                              <button
                                type="button"
                                onClick={() => {
                                  setPollVotes(v => ({ ...v, [option]: v[option] + 1 }));
                                  if (socket && socket.readyState === WebSocket.OPEN) {
                                    socket.send(JSON.stringify({
                                      type: "couple_action",
                                      payload: {
                                        action: "poll_vote",
                                        payload: option
                                      }
                                    }));
                                  }
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}

              {/* 4. 📜 Memories Timeline Tab */}
              {activeTab === "timeline" && (
                <div className="flex flex-col gap-4 text-left" id="memory-timeline-tab">
                  
                  <div className="flex items-center justify-between border-b border-purple-950 pb-2">
                    <h4 className="text-xs font-extrabold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-purple-400" /> Memory Timeline (Digital Diary)
                    </h4>
                    <span className="text-[10px] text-zinc-500 font-semibold uppercase font-mono">LOCKED SAFELY</span>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Preserve your screens and conversations emotionally. Clicking the button below captures the active date, movie name, and cumulative seconds watched into a permanent keepsake.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      const currentSession = {
                        id: `mem-${Date.now()}`,
                        date: new Date().toISOString().split("T")[0],
                        movieName: roomState.videoTitle || "Curated Film Stream",
                        durationHours: Number(((watchTime - (327 * 3600 + 42 * 60)) / 3600 + 1.2).toFixed(1)),
                        chatMemories: "We finished watching this beautiful movie together in real-time sync! 🥺💞"
                      };
                      const updated = [currentSession, ...memories];
                      setMemories(updated);
                      localStorage.setItem(`nipora_memories_${roomState.roomId}`, JSON.stringify(updated));
                      showToast("📸 Captured! Session memorialized on your Memory Timeline! 💖");
                    }}
                    className="py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-95 text-white font-extrabold text-[10px] uppercase tracking-widest shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    📸 Save Current Watch Session to Memories Timeline
                  </button>

                  <div className="space-y-3 mt-2">
                    {memories.map((mem: any) => (
                      <div key={mem.id} className="p-3 rounded-xl border border-purple-950 bg-neutral-950/40 relative group/mem">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-zinc-500 font-mono font-bold">{mem.date}</span>
                          <span className="text-purple-400 font-bold font-mono">{mem.durationHours} hours watchtime</span>
                        </div>
                        <h5 className="text-xs font-extrabold text-zinc-200 mt-1">{mem.movieName}</h5>
                        <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed bg-purple-950/10 p-2 rounded-lg border border-purple-500/5 italic">
                          "{mem.chatMemories}"
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = memories.filter((m: any) => m.id !== mem.id);
                            setMemories(updated);
                            localStorage.setItem(`nipora_memories_${roomState.roomId}`, JSON.stringify(updated));
                          }}
                          className="absolute top-2 right-2 text-zinc-600 hover:text-rose-400 opacity-0 group-hover/mem:opacity-100 transition"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-purple-950/20 rounded-xl border border-purple-500/10 text-center text-[10px] text-zinc-400 leading-relaxed font-medium">
                    ⏱️ <strong className="text-purple-300 font-bold">Emotional Connection Record:</strong> "Aap dono ne total {Math.round(watchTime / 3600)} ghante saath movies dekhi hain! Watch Together. Feel Together."
                  </div>

                </div>
              )}

              {/* 5. 👑 Premium Club Tab */}
              {activeTab === "premium" && (
                <div className="flex flex-col gap-4 text-left" id="premium-customization-tab">
                  
                  <div className="flex items-center justify-between border-b border-purple-950 pb-2">
                    <h4 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-amber-500" /> Premium Personalization Suite
                    </h4>
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-black uppercase">
                      ACTIVE
                    </span>
                  </div>

                  <div className="flex flex-col gap-4">
                    {/* Theme Selection Buttons */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Custom Room Color Themes</span>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {[
                          { id: "violet", name: "🌌 Neon Amethyst", desc: "Glowing purple" },
                          { id: "black", name: "🖤 Vantablack", desc: "Pure deep black" },
                          { id: "cyan_glow", name: "🧪 Cyber Mint", desc: "Cyan cyber stream" },
                          { id: "romantic_red", name: "🌹 Ethereal Rose", desc: "Crimson glow" }
                        ].map((theme) => (
                          <button
                            key={theme.id}
                            type="button"
                            onClick={() => {
                              setSelectedTheme(theme.id as any);
                              showToast(`Atmospheric Room Skin updated to: ${theme.name} 🌌`);
                            }}
                            className={`p-2.5 rounded-xl border text-[11px] font-bold text-left transition ${
                              selectedTheme === theme.id
                                ? "bg-purple-950/30 border-purple-500 shadow-md"
                                : "bg-neutral-950 border-purple-950 hover:border-purple-900"
                            }`}
                          >
                            <div className="text-zinc-100">{theme.name}</div>
                            <div className="text-[9px] text-zinc-500 mt-0.5 font-normal">{theme.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Premium switches */}
                    <div className="space-y-3.5 border-t border-purple-950/40 pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-bold text-zinc-200">HD Watch Room Mode</span>
                          <span className="text-[10px] text-zinc-500">Unlocks high-bitrate media streaming stream</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setHdEnabled(!hdEnabled);
                            showToast(hdEnabled ? "HD watch room disabled" : "1080p high bitrate enabled for everyone! 🍿");
                          }}
                          className={`w-11 h-6 rounded-full p-1 transition ${hdEnabled ? "bg-purple-600" : "bg-neutral-950 border border-purple-950"}`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-white transition transform ${hdEnabled ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-bold text-zinc-200">Animated Emoji Reactions</span>
                          <span className="text-[10px] text-zinc-500">Enables gorgeous floating particle overlays</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAnimatedEmojis(!animatedEmojis)}
                          className={`w-11 h-6 rounded-full p-1 transition ${animatedEmojis ? "bg-purple-600" : "bg-neutral-950 border border-purple-950"}`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-white transition transform ${animatedEmojis ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-bold text-zinc-200">Gold Couple Badge</span>
                          <span className="text-[10px] text-zinc-500">Render lovely couple markers on the lists</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCoupleBadge(!coupleBadge)}
                          className={`w-11 h-6 rounded-full p-1 transition ${coupleBadge ? "bg-purple-600" : "bg-neutral-950 border border-purple-950"}`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-white transition transform ${coupleBadge ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-bold text-rose-300">Remove All Ad Banners (No Ads)</span>
                          <span className="text-[10px] text-zinc-500">Instantly collapses and hides all simulated banner ads</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsPremium(!isPremium);
                            showToast(isPremium ? "Ad simulation enabled" : "Ads removed completely! Enjoy the clean cinema look 👑");
                          }}
                          className={`w-11 h-6 rounded-full p-1 transition ${isPremium ? "bg-rose-600" : "bg-neutral-950 border border-purple-950"}`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-white transition transform ${isPremium ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* 6. 💰 UPI & Support Tab */}
              {activeTab === "settings" && (
                <div className="flex flex-col gap-4 text-left" id="monetization-tab">
                  {isHost ? (
                    <div className="bg-neutral-900/60 border border-purple-950 p-4 rounded-xl flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-yellow-500 shrink-0" />
                        <h4 className="text-xs font-extrabold text-zinc-200">Host Earnings Configuration</h4>
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        Earn from your watchrooms! Enter your real UPI ID below. Guests will see beautiful ticket checkout portals to support your stream.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-1">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Your UPI Address</label>
                          <input
                            type="text"
                            placeholder="e.g. paresh@ybl"
                            className="bg-neutral-950 border border-purple-950 rounded-lg p-2.5 text-xs text-white"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Ticket Price (₹)</label>
                          <input
                            type="number"
                            defaultValue={50}
                            className="bg-neutral-950 border border-purple-950 rounded-lg p-2.5 text-xs text-white font-mono"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => showToast("Settings saved locally! UPI configuration synced. 💸")}
                        className="self-start bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-lg mt-1"
                      >
                        Save Configurations
                      </button>
                    </div>
                  ) : (
                    <div className="bg-neutral-900/60 border border-purple-950 p-4 rounded-xl flex flex-col gap-3">
                      <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                        <span>🎟️</span> Support Your Room Host
                      </h4>
                      <p className="text-[11px] text-zinc-500">
                        Buy a premium watchroom ticket set by the host to show appreciation! It opens safe standard UPI payment handles.
                      </p>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleInitiatePayment(50, true)}
                          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-95 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg"
                        >
                          Buy Watch Ticket (₹50)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInitiatePayment(20, false)}
                          className="bg-neutral-950 hover:bg-neutral-900 border border-purple-950 text-purple-300 text-xs font-bold px-4 py-2 rounded-xl"
                        >
                          Send Popcorn Tip (₹20)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Right Column: Distance Meter, Room Audience, Voice Chat & Webcam (4 cols on lg) */}
        <div className="lg:col-span-4 flex flex-col gap-6" id="theatre-interactivity-column">
          
          {/* A. Dynamic Distance Meter */}
          <div className="bg-gradient-to-br from-neutral-950 via-[#0a0518] to-neutral-950 border border-purple-950/60 rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden group">
            {/* Animated cosmic beam overlay */}
            <div className="absolute top-0 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-purple-400 animate-spin" style={{ animationDuration: "12s" }} />
                <h3 className="text-xs font-black text-zinc-300 uppercase tracking-widest">
                  Live Distance Meter
                </h3>
              </div>
              <span className="text-[9px] bg-purple-950/40 text-purple-300 px-2 py-0.5 rounded border border-purple-900/30 font-bold uppercase">
                Active
              </span>
            </div>

            {partnerUser ? (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between bg-neutral-900/40 border border-purple-950/40 p-3 rounded-xl">
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">LONG DISTANCE RANGE</span>
                    <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-300 font-mono tracking-tighter">
                      {distanceText || "230 km"}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-purple-950/20 border border-purple-900 flex items-center justify-center text-lg animate-pulse">
                    📍
                  </div>
                </div>

                <div className="text-[11px] text-zinc-400 leading-relaxed text-left">
                  You are watching from <strong className="text-white">{myUser?.locationName || "Local Room"}</strong> and your partner is in <strong className="text-white">{partnerUser.locationName || "Surat, GJ"}</strong>!
                </div>
              </div>
            ) : (
              <div className="p-4 bg-neutral-900/20 border border-dashed border-purple-950/40 rounded-xl text-center flex flex-col items-center gap-1.5">
                <span className="text-xl">🗺️</span>
                <p className="text-[11px] text-zinc-500">
                  Waiting for your partner to join to compute proximity...
                </p>
                <button
                  onClick={handleCopyLink}
                  className="text-[10px] font-bold text-purple-400 hover:text-purple-300 underline"
                >
                  Share room code to start
                </button>
              </div>
            )}
          </div>

          {/* B. Room Audience Participants ("Side me participants ke profile photos") */}
          <div className="bg-neutral-950/70 border border-purple-950/30 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-purple-950/30">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400 shrink-0" />
                <h3 className="text-xs font-black text-zinc-300 uppercase tracking-widest">
                  Room Audience ({Object.keys(roomState.users).length})
                </h3>
              </div>
              {isPremium && (
                <span className="flex items-center gap-0.5 text-[9px] text-yellow-400 font-black tracking-wider uppercase bg-yellow-950/30 border border-yellow-900/30 px-2 py-0.5 rounded">
                  <Crown className="w-3 h-3" /> Premium Rm
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2.5 max-h-[360px] overflow-y-auto scrollbar-none" id="sidebar-participants-list">
              {Object.values(roomState.users).map((user: any) => {
                const userIsMe = user.userId === userId;
                return (
                  <div
                    key={user.userId}
                    className="flex flex-col gap-1.5 bg-neutral-900/40 border border-purple-950/30 p-2.5 rounded-xl hover:border-purple-500/30 transition group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        {/* Interactive Avatar with glow borders */}
                        <div
                          className="w-8 h-8 rounded-full border flex items-center justify-center text-sm relative shrink-0 bg-neutral-950 shadow-md font-bold"
                          style={{ borderColor: user.color, boxShadow: `0 0 10px ${user.color}15` }}
                        >
                          {user.avatar}
                          <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-black" />
                        </div>
                        
                        <div className="text-left flex flex-col">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-zinc-200 group-hover:text-white truncate max-w-[100px]">{user.username}</span>
                            {user.isPremium && <Crown className="w-3.5 h-3.5 text-yellow-500 animate-pulse" title="Nipora Premium Member" />}
                            {userIsMe && <span className="text-[8px] bg-zinc-800 text-zinc-400 px-1 py-0.2 rounded font-semibold font-mono">YOU</span>}
                          </div>
                          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
                            {user.locationName || "Ahmedabad, GJ"}{user.country ? `, ${user.country}` : ""}
                          </span>
                        </div>
                      </div>

                      {/* Status Tags */}
                      <div className="flex items-center gap-1.5">
                        {roomState.hostId === user.userId ? (
                          <span className="text-[8px] bg-amber-500/15 text-amber-500 px-1.5 py-0.5 rounded font-black border border-amber-500/30 uppercase tracking-wider">Host</span>
                        ) : (
                          <span className="text-[8px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-bold border border-zinc-700 uppercase tracking-wider">Guest</span>
                        )}
                      </div>
                    </div>

                    {/* Extended Info Section */}
                    {(user.relationshipStatus || user.bio || user.language || user.favGenre) && (
                      <div className="mt-1 pt-1.5 border-t border-purple-950/20 text-left flex flex-col gap-1 text-[10px]">
                        {user.relationshipStatus && (
                          <div className="flex items-center gap-1 text-pink-400/90 font-semibold">
                            <span>💞</span>
                            <span>{user.relationshipStatus}</span>
                          </div>
                        )}
                        {user.bio && (
                          <p className="text-zinc-400 italic font-medium leading-relaxed bg-neutral-950/30 p-1.5 rounded border border-purple-950/10">
                            "{user.bio}"
                          </p>
                        )}
                        {(user.language || user.favGenre) && (
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {user.language && (
                              <span className="text-[9px] bg-zinc-950/60 border border-zinc-800/80 text-zinc-400 px-1.5 py-0.5 rounded-lg font-bold">
                                🌐 {user.language}
                              </span>
                            )}
                            {user.favGenre && (
                              <span className="text-[9px] bg-purple-950/30 border border-purple-900/30 text-purple-300 px-1.5 py-0.5 rounded-lg font-bold">
                                🎬 {user.favGenre}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* C. Live Spatial Voice Room */}
          <div className="bg-neutral-950/70 border border-purple-950/30 rounded-2xl p-4 flex flex-col gap-3 text-left">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-xs font-black text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-purple-400" />
                <span>Room Voice Chat</span>
              </h3>
              {isInVoice && (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 uppercase tracking-widest animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Connected
                </span>
              )}
            </div>

            <div className="p-3 bg-neutral-900/30 border border-purple-950/40 rounded-xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-extrabold text-zinc-200 block">Spatial Audio Room</span>
                  <span className="text-[10px] text-zinc-500 block">Whisper in perfect sync with the film</span>
                </div>
                
                {/* Voice button */}
                <button
                  type="button"
                  onClick={() => setIsInVoice(!isInVoice)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1 transition ${
                    isInVoice 
                      ? "bg-red-950/40 border-red-900/40 text-red-200" 
                      : "bg-purple-950/40 border-purple-900/40 text-purple-200"
                  }`}
                >
                  {isInVoice ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span>{isInVoice ? "Disconnect" : "Join Voice"}</span>
                </button>
              </div>

              {isInVoice && (
                <div className="flex items-center gap-2 border-t border-purple-950/20 pt-2.5">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-2 rounded-xl border text-xs flex items-center gap-1 transition ${
                      isMuted 
                        ? "bg-neutral-850 border-zinc-800 text-zinc-500" 
                        : "bg-neutral-900 border-purple-950 text-purple-300"
                    }`}
                  >
                    {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
                    <span>{isMuted ? "Mic Muted" : "Mic Open"}</span>
                  </button>

                  {/* Audio Visualizer Waves simulation */}
                  {!isMuted && (
                    <div className="flex items-end gap-0.5 h-4 px-2">
                      <span className="w-0.5 bg-purple-500 animate-[shimmer_0.6s_infinite_alternate]" style={{ height: "40%" }} />
                      <span className="w-0.5 bg-purple-500 animate-[shimmer_0.8s_infinite_alternate]" style={{ height: "100%" }} />
                      <span className="w-0.5 bg-purple-500 animate-[shimmer_0.5s_infinite_alternate]" style={{ height: "60%" }} />
                      <span className="w-0.5 bg-purple-500 animate-[shimmer_0.7s_infinite_alternate]" style={{ height: "80%" }} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* D. Picture-in-Picture Webcam Video Call */}
          <div className="bg-neutral-950/70 border border-purple-950/30 rounded-2xl p-4 flex flex-col gap-3 text-left">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-xs font-black text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-purple-400" />
                <span>Long-Distance Camera</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCameraOn(!isCameraOn)}
                className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                {isCameraOn ? <CameraOff className="w-3.5 h-3.5 text-red-400" /> : <Camera className="w-3.5 h-3.5 text-purple-400 animate-pulse" />}
                <span>{isCameraOn ? "Stop Cam" : "Start Cam"}</span>
              </button>
            </div>

            {/* Webcam window element */}
            <div className="aspect-video w-full rounded-2xl bg-neutral-900 border border-purple-950/60 overflow-hidden relative flex flex-col items-center justify-center text-center shadow-inner">
              <AnimatePresence mode="wait">
                {isCameraOn ? (
                  <motion.video
                    key="webcam-live"
                    ref={webcamVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                ) : (
                  <motion.div
                    key="webcam-placeholder"
                    className="flex flex-col items-center gap-1.5 p-4 text-zinc-600"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <span className="text-2xl opacity-60">📷</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Camera Stream Offline</span>
                    <p className="text-[9px] text-zinc-600 leading-normal max-w-[180px]">Turn on camera to see your facial reactions overlayed in the Cinema corner</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Float micro badge */}
              <div className="absolute bottom-2 left-2 bg-neutral-950/80 border border-purple-900/50 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider text-purple-300">
                {isCameraOn ? "Webcam Live Feed" : "PiP Panel"}
              </div>
            </div>
          </div>

          {/* E. Quick Reaction Buttons Floating deck */}
          <div className="bg-neutral-950/70 border border-purple-950/30 rounded-2xl p-4 flex flex-col gap-3">
            <h3 className="text-xs font-black text-zinc-300 uppercase tracking-widest text-left flex items-center gap-1.5">
              <Smile className="w-4 h-4 text-purple-400" />
              <span>Tap Emojis to Blast Screen</span>
            </h3>
            <div className="grid grid-cols-6 gap-2">
              {REACTION_LIST.map((react) => (
                <button
                  key={react.emoji}
                  onClick={() => onTriggerReaction(react.emoji)}
                  className="aspect-square bg-neutral-900 hover:bg-neutral-850 border border-purple-950/60 hover:border-purple-900 hover:scale-110 text-xl flex items-center justify-center rounded-xl transition transform active:scale-125 focus:outline-none"
                  title={react.label}
                >
                  {react.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* F. Google AdSense Simulated Feed */}
          {!isPremium && (
            <div className="bg-neutral-950 border border-purple-950/40 rounded-2xl p-3.5 flex flex-col gap-2 text-left relative overflow-hidden group shadow-md mt-1">
              <div className="flex justify-between items-center text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                <span>Google AdSense Partner</span>
                <span className="text-purple-400">Ad slot #2908</span>
              </div>
              <div className="h-20 rounded-xl bg-neutral-900/40 border border-dashed border-purple-950/50 flex flex-col items-center justify-center text-center px-4">
                <span className="text-xl">🍿</span>
                <p className="text-[10px] font-semibold text-zinc-400 mt-1">Buy a Host Ticket or Upgrade to Premium to remove ads!</p>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* 3. Checkout Modal */}
      <AnimatePresence>
        {showCheckoutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-neutral-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
            id="checkout-modal-overlay"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-neutral-900 border border-purple-900/40 rounded-3xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden"
              id="checkout-modal-card"
            >
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />
              
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white text-xs bg-neutral-950 border border-purple-950/50 w-7 h-7 rounded-full flex items-center justify-center"
              >
                ✕
              </button>

              <div className="flex flex-col gap-4 text-center">
                <span className="text-4xl">🎟️</span>
                <h3 className="text-lg font-black text-white">
                  {checkoutIsTicket ? "Buy Premium Watchroom Ticket" : "Send Creator Tip"}
                </h3>
                <p className="text-xs text-zinc-400">
                  Transaction directly supports: <span className="font-bold text-purple-400">{roomState.users[roomState.hostId]?.username || "Host"}</span>
                </p>

                <div className="bg-neutral-950 border border-purple-950 p-4 rounded-2xl">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Payable Amount</span>
                  <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-300 font-mono block mt-1">
                    ₹{checkoutAmount}
                  </span>
                </div>

                <div className="text-[11px] text-zinc-500 leading-relaxed max-w-xs mx-auto">
                  By clicking below, standard secure payment instructions are simulated, granting you instant exclusive watcher badge decorations inside the room.
                </div>

                <button
                  onClick={handleConfirmCheckoutPayment}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black py-3.5 rounded-xl text-xs uppercase tracking-wider"
                >
                  {checkoutStep === "processing" ? "Synchronizing Payment..." : checkoutStep === "success" ? "Ticket Purchased!" : "Confirm & Pay via UPI"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Upgrade Premium Room Modal */}
      <AnimatePresence>
        {showPremiumModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-neutral-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-neutral-900 border border-purple-900/40 rounded-3xl p-6 max-w-md w-full text-center relative overflow-hidden"
            >
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-yellow-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <button
                onClick={() => setShowPremiumModal(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white text-xs bg-neutral-950 border border-purple-950/50 w-7 h-7 rounded-full flex items-center justify-center"
              >
                ✕
              </button>

              <div className="flex flex-col gap-4">
                <span className="text-4xl animate-bounce">👑</span>
                <h3 className="text-lg font-black text-white">Upgrade to Nipora Premium</h3>
                <p className="text-xs text-zinc-400">
                  Unlocks premium 4GB direct file uploads, removes all Google AdSense sponsor banners, and adds the gold crown badge to your watcher card!
                </p>

                <div className="bg-neutral-950 border border-purple-950 p-4 rounded-xl">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase block">Premium Lifetime Room Code</span>
                  <span className="text-2xl font-black text-yellow-400 font-mono block mt-0.5">₹199</span>
                </div>

                <button
                  onClick={handleConfirmPremiumPayment}
                  className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-extrabold py-3.5 rounded-xl text-xs uppercase tracking-wider"
                >
                  {premiumPaymentStep === "processing" ? "Verifying Transaction..." : premiumPaymentStep === "success" ? "Premium Room Unlocked!" : "Activate Room Premium"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
