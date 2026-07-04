import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Video, 
  Keyboard, 
  Key, 
  Play, 
  ArrowRight, 
  UserCheck, 
  X, 
  Shield, 
  Users, 
  Heart, 
  Smartphone, 
  Crown, 
  MapPin, 
  History, 
  Calendar, 
  Lock, 
  LogOut, 
  CheckCircle,
  Clock,
  Compass
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import NiporaLogo from "./NiporaLogo";

interface WelcomeScreenProps {
  initialRoomId: string;
  onJoin: (
    username: string,
    avatar: string,
    color: string,
    roomId: string,
    latitude?: number,
    longitude?: number,
    locationName?: string,
    isPremium?: boolean,
    bio?: string,
    country?: string,
    language?: string,
    favGenre?: string,
    relationshipStatus?: string
  ) => void;
}

const AVATAR_OPTIONS = [
  { emoji: "🍿", label: "Popcorn" },
  { emoji: "🎬", label: "Cinema" },
  { emoji: "🦊", label: "Fox" },
  { emoji: "🐰", label: "Rabbit" },
  { emoji: "🐼", label: "Panda" },
  { emoji: "🐥", label: "Chick" },
  { emoji: "💖", label: "Heart" },
  { emoji: "🍕", label: "Pizza" },
  { emoji: "🎮", label: "Gamer" },
  { emoji: "☕", label: "Coffee" },
  { emoji: "🌙", label: "Moon" },
  { emoji: "✨", label: "Sparkles" }
];

const COLOR_OPTIONS = [
  { hex: "#A78BFA", name: "Cosmic Purple" },
  { hex: "#60A5FA", name: "Electric Blue" },
  { hex: "#EF4444", name: "Romantic Red" },
  { hex: "#EC4899", name: "Dreamy Pink" },
  { hex: "#10B981", name: "Emerald Mint" },
  { hex: "#F59E0B", name: "Cosmic Amber" }
];

// Presets of Indian cities for manual selection/fallbacks
const INDIAN_CITIES = [
  { name: "Ahmedabad, GJ", lat: 23.0225, lng: 72.5714 },
  { name: "Surat, GJ", lat: 21.1702, lng: 72.8311 },
  { name: "Mumbai, MH", lat: 19.0760, lng: 72.8777 },
  { name: "Pune, MH", lat: 18.5204, lng: 73.8567 },
  { name: "Delhi, DL", lat: 28.7041, lng: 77.1025 },
  { name: "Bengaluru, KA", lat: 12.9716, lng: 77.5946 },
  { name: "Kolkata, WB", lat: 22.5726, lng: 88.3639 },
  { name: "Chennai, TN", lat: 13.0827, lng: 80.2707 },
];

const MOCK_FRIENDS = [
  { id: "f1", name: "Paresh Chavda", avatar: "🦊", active: true, color: "#A78BFA", location: "Ahmedabad, GJ" },
  { id: "f2", name: "Aanya Mehta", avatar: "🐰", active: true, color: "#EC4899", location: "Surat, GJ" },
  { id: "f3", name: "Dev Patel", avatar: "🎮", active: false, color: "#60A5FA", location: "Mumbai, MH" },
  { id: "f4", name: "Karan Shah", avatar: "🍿", active: true, color: "#F59E0B", location: "Pune, MH" },
];

const MOCK_HISTORY = [
  { room: "NIPORA-X9A2F", title: "Sintel (Fantasy Short Film)", date: "Yesterday", companion: "Aanya Mehta" },
  { room: "NIPORA-K3J8W", title: "Tears of Steel (Sci-Fi CGI)", date: "3 days ago", companion: "Paresh Chavda" },
];

const getNicknameForAvatar = (avatar: string) => {
  switch (avatar) {
    case "🍿": return "Popcorn";
    case "🎬": return "Cinephile";
    case "🦊": return "Sweet Fox";
    case "🐰": return "Cute Rabbit";
    case "🐼": return "Cozy Panda";
    case "🐥": return "Little Chick";
    case "💖": return "Sweetheart";
    case "🍕": return "Pizza Lover";
    case "🎮": return "Gamer";
    case "☕": return "Coffee Lover";
    case "🌙": return "Moonlight";
    case "✨": return "Sparky";
    default: return "Partner";
  }
};

export default function WelcomeScreen({ initialRoomId, onJoin }: WelcomeScreenProps) {
  // Steps: "login" | "profile" | "lobby"
  const [currentStep, setCurrentStep] = useState<"login" | "profile" | "lobby">("login");
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"google" | "phone" | "email">("google");
  
  // Phone Login State
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState(false);

  // Email Login State
  const [emailInput, setEmailInput] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState("");
  const [isVerifyingEmailOtp, setIsVerifyingEmailOtp] = useState(false);

  // Profile Customizer State
  const [username, setUsername] = useState("Nipora Fan");
  const [selectedAvatar, setSelectedAvatar] = useState("🦊");
  const [selectedColor, setSelectedColor] = useState("#A78BFA");
  const [isPremiumEnabled, setIsPremiumEnabled] = useState(false);

  // Profile Extended Meta States
  const [bio, setBio] = useState("");
  const [country, setCountry] = useState("India");
  const [language, setLanguage] = useState("Hindi");
  const [favGenre, setFavGenre] = useState("Bollywood Romance");
  const [relationshipStatus, setRelationshipStatus] = useState("Long Distance Lovebirds");

  // Location/Distance Meter state
  const [useRealLocation, setUseRealLocation] = useState(true);
  const [manualCityIndex, setManualCityIndex] = useState(0);
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [locationName, setLocationName] = useState<string | undefined>("Ahmedabad, GJ");
  const [locationStatus, setLocationStatus] = useState<"idle" | "fetching" | "success" | "denied">("idle");

  // Lobby state
  const [roomIdInput, setRoomIdInput] = useState(initialRoomId || "");
  const [isJoiningExisting, setIsJoiningExisting] = useState(!!initialRoomId);
  const [recentRooms, setRecentRooms] = useState<{ roomId: string; date: number }[]>([]);
  const [lobbyTab, setLobbyTab] = useState<"home" | "continue" | "create" | "join" | "public" | "couple">("home");

  // Watch Party Schedule State
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState("Sunday Movie Night");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduledParties, setScheduledParties] = useState<{ id: string; title: string; time: string; timestamp: number }[]>([]);

  // Background star-particles
  const [particles] = useState(() =>
    Array.from({ length: 35 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.2 + 1.0,
      delay: Math.random() * 5,
      duration: Math.random() * 16 + 10,
    }))
  );

  // Check login state and recent rooms on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("nipora_user_profile");
    const savedRooms = localStorage.getItem("nipora_recent_rooms");
    const savedSchedules = localStorage.getItem("nipora_scheduled_parties");

    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUsername(parsed.username);
        setSelectedAvatar(parsed.avatar);
        setSelectedColor(parsed.color);
        setIsPremiumEnabled(!!parsed.isPremium);
        setLatitude(parsed.latitude);
        setLongitude(parsed.longitude);
        setLocationName(parsed.locationName);
        if (parsed.bio) setBio(parsed.bio);
        if (parsed.country) setCountry(parsed.country);
        if (parsed.language) setLanguage(parsed.language);
        if (parsed.favGenre) setFavGenre(parsed.favGenre);
        if (parsed.relationshipStatus) setRelationshipStatus(parsed.relationshipStatus);
        setCurrentStep("lobby");
      } catch (e) {
        console.warn("Could not load user profile:", e);
      }
    }

    if (savedRooms) {
      try {
        setRecentRooms(JSON.parse(savedRooms));
      } catch (e) {}
    }

    if (savedSchedules) {
      try {
        setScheduledParties(JSON.parse(savedSchedules));
      } catch (e) {}
    } else {
      // Default scheduled party
      const defaultTime = new Date();
      defaultTime.setHours(defaultTime.getHours() + 4);
      const defaultParties = [{
        id: "sch-1",
        title: "Sintel Weekend Screening 🎬",
        time: defaultTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        timestamp: defaultTime.getTime()
      }];
      setScheduledParties(defaultParties);
      localStorage.setItem("nipora_scheduled_parties", JSON.stringify(defaultParties));
    }
  }, []);

  const handleDownloadZipClick = (e: React.MouseEvent) => {
    // If inside iframe, open our custom guidance modal
    const isIframe = window.self !== window.top;
    if (isIframe) {
      e.preventDefault();
      setShowDownloadModal(true);
    }
  };

  // Fetch Geolocation
  useEffect(() => {
    if (currentStep === "profile" && useRealLocation) {
      fetchUserLocation();
    } else if (!useRealLocation) {
      const city = INDIAN_CITIES[manualCityIndex];
      setLatitude(city.lat);
      setLongitude(city.lng);
      setLocationName(city.name);
      setLocationStatus("success");
    }
  }, [currentStep, useRealLocation, manualCityIndex]);

  const fetchUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("denied");
      // Fallback
      setLatitude(INDIAN_CITIES[0].lat);
      setLongitude(INDIAN_CITIES[0].lng);
      setLocationName(INDIAN_CITIES[0].name);
      return;
    }

    setLocationStatus("fetching");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setLocationName("My Location");
        setLocationStatus("success");
      },
      (err) => {
        console.log("Geolocation error:", err);
        setLocationStatus("denied");
        // Fallback to Ahmedabad
        setLatitude(INDIAN_CITIES[0].lat);
        setLongitude(INDIAN_CITIES[0].lng);
        setLocationName(INDIAN_CITIES[0].name);
      },
      { timeout: 8000 }
    );
  };

  const playCinemaChime = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      // Cinematic low deep rumble
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(60.00, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(120.00, ctx.currentTime + 1.2);
      gain1.gain.setValueAtTime(0.01, ctx.currentTime);
      gain1.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.3);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.6);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 1.6);

      // Chimes
      const playChimeTone = (freq: number, delay: number, duration: number, volume: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0.001, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + duration);
      };

      playChimeTone(329.63, 0.0, 1.2, 0.08); // E4
      playChimeTone(392.00, 0.1, 1.2, 0.08); // G4
      playChimeTone(587.33, 0.2, 1.4, 0.06); // D5
      playChimeTone(783.99, 0.3, 1.6, 0.04); // G5
    } catch (e) {
      console.warn("Audio chime prevented:", e);
    }
  };

  const handleGoogleLogin = () => {
    playCinemaChime();
    // Simulate real quick Google sign in, saving profile and switching steps
    localStorage.setItem("nipora_auth_user", JSON.stringify({ name: "Google Cinephile", email: "user@gmail.com" }));
    setCurrentStep("profile");
  };

  const handlePhoneRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      setOtpError("Sahi 10-digit mobile number likhiye.");
      return;
    }
    setOtpError("");
    setOtpSent(true);
    // Autofill simulated OTP 290805
    setTimeout(() => {
      setOtpCode("290805");
    }, 1500);
  };

  const handlePhoneVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode !== "290805" && otpCode !== "123456") {
      setOtpError("Galat OTP! Sahi code '290805' enter kijiye.");
      return;
    }
    setOtpError("");
    setIsVerifyingOtp(true);
    setTimeout(() => {
      setIsVerifyingOtp(false);
      setOtpSuccess(true);
      setTimeout(() => {
        localStorage.setItem("nipora_auth_user", JSON.stringify({ name: "Phone User", phone: phoneNumber }));
        setCurrentStep("profile");
      }, 800);
    }, 1500);
  };

  const handleEmailRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes("@")) {
      setOtpError("Please enter a valid email address.");
      return;
    }
    setOtpError("");
    setEmailOtpSent(true);
    // Autofill simulated OTP 123456
    setTimeout(() => {
      setEmailOtpCode("123456");
    }, 1500);
  };

  const handleEmailVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailOtpCode !== "123456") {
      setOtpError("Incorrect OTP! Please use simulated code '123456'.");
      return;
    }
    setOtpError("");
    setIsVerifyingEmailOtp(true);
    setTimeout(() => {
      setIsVerifyingEmailOtp(false);
      setOtpSuccess(true);
      setTimeout(() => {
        localStorage.setItem("nipora_auth_user", JSON.stringify({ name: "Email User", email: emailInput }));
        setCurrentStep("profile");
      }, 800);
    }, 1500);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const finalUsername = username.trim() || getNicknameForAvatar(selectedAvatar);
    
    const userProfile = {
      username: finalUsername,
      avatar: selectedAvatar,
      color: selectedColor,
      isPremium: isPremiumEnabled,
      latitude,
      longitude,
      locationName,
      bio,
      country,
      language,
      favGenre,
      relationshipStatus
    };
    
    localStorage.setItem("nipora_user_profile", JSON.stringify(userProfile));
    setCurrentStep("lobby");
    playCinemaChime();
  };

  const handleLobbySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalUsername = username || getNicknameForAvatar(selectedAvatar);

    let finalRoomId = roomIdInput.trim().toUpperCase();
    if (!finalRoomId) {
      finalRoomId = `NIPORA-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    }

    // Save recent rooms
    const updatedRecent = [{ roomId: finalRoomId, date: Date.now() }, ...recentRooms.filter(r => r.roomId !== finalRoomId)].slice(0, 5);
    setRecentRooms(updatedRecent);
    localStorage.setItem("nipora_recent_rooms", JSON.stringify(updatedRecent));

    playCinemaChime();
    onJoin(
      finalUsername, 
      selectedAvatar, 
      selectedColor, 
      finalRoomId, 
      latitude, 
      longitude, 
      locationName, 
      isPremiumEnabled,
      bio,
      country,
      language,
      favGenre,
      relationshipStatus
    );
  };

  const handleQuickJoinRecent = (room: string) => {
    setRoomIdInput(room);
    setIsJoiningExisting(true);
    playCinemaChime();
    const finalUsername = username || getNicknameForAvatar(selectedAvatar);
    onJoin(
      finalUsername, 
      selectedAvatar, 
      selectedColor, 
      room, 
      latitude, 
      longitude, 
      locationName, 
      isPremiumEnabled,
      bio,
      country,
      language,
      favGenre,
      relationshipStatus
    );
  };

  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleTime) return;
    const newId = `sch-${Date.now()}`;
    const newParty = {
      id: newId,
      title: scheduleTitle,
      time: scheduleTime,
      timestamp: Date.now() + 3600 * 1000 * 2 // Roughly 2 hours out for countdown representation
    };
    const updatedSchedules = [newParty, ...scheduledParties];
    setScheduledParties(updatedSchedules);
    localStorage.setItem("nipora_scheduled_parties", JSON.stringify(updatedSchedules));
    setScheduleTitle("Sunday Movie Night");
    setScheduleTime("");
    setShowScheduleForm(false);
  };

  const handleDeleteSchedule = (id: string) => {
    const updated = scheduledParties.filter(p => p.id !== id);
    setScheduledParties(updated);
    localStorage.setItem("nipora_scheduled_parties", JSON.stringify(updated));
  };

  const handleLogOut = () => {
    localStorage.removeItem("nipora_user_profile");
    localStorage.removeItem("nipora_auth_user");
    setCurrentStep("login");
    setOtpSent(false);
    setPhoneNumber("");
    setOtpCode("");
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-y-auto overflow-x-hidden selection:bg-purple-600/30 pb-20" id="lobby-root">
      
      {/* Cinematic Star Particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute bg-purple-500/10 rounded-full pointer-events-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: ["0%", "-35%", "0%"],
            x: ["0%", "10%", "0%"],
            opacity: [0.08, 0.4, 0.08],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: p.delay,
          }}
        />
      ))}

      {/* Atmospheric glowing colors - Neon Purple and Cyber Blue Glows */}
      <div className="absolute top-1/4 left-1/4 w-[45vw] h-[45vw] rounded-full bg-purple-600/10 blur-[130px] pointer-events-none animate-pulse" style={{ animationDuration: "8s" }} />
      <div className="absolute bottom-1/4 right-1/4 w-[50vw] h-[50vw] rounded-full bg-cyan-500/10 blur-[140px] pointer-events-none animate-pulse" style={{ animationDuration: "13s" }} />

      {/* 1. Header Navigation */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between z-20 relative">
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-950 border border-purple-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.25)] relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 to-cyan-400/30 group-hover:opacity-100 transition duration-300" />
              <span className="text-xl relative z-10">🍿</span>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-300 to-cyan-300">
                Nipora
              </span>
              <span className="text-[9px] font-bold text-cyan-400 tracking-wider uppercase">
                No Distance, Just Together
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/api/download-zip"
            download="nipora-theatre-source.zip"
            onClick={handleDownloadZipClick}
            className="flex items-center gap-2 border border-red-500/30 hover:border-red-500/50 text-red-400 hover:text-red-300 px-4 py-2 rounded-full text-xs font-black tracking-wider uppercase transition duration-300 bg-red-950/20 backdrop-blur shadow-[0_0_15px_rgba(239,68,68,0.15)] active:scale-95 cursor-pointer"
            id="header-download-zip-btn"
          >
            <span className="animate-pulse">📥</span>
            <span>Download Source ZIP</span>
          </a>

          {currentStep !== "login" && (
            <button
              onClick={handleLogOut}
              className="flex items-center gap-2 border border-purple-950 hover:border-purple-900 text-purple-200 hover:text-white px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition duration-300 bg-purple-950/30 backdrop-blur shadow-sm active:scale-95"
              id="header-logout-btn"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. Main Content Split Panel */}
      <main className="w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start flex-1 z-10 relative mt-4 md:mt-8">
        
        {/* Left Side: App Pitch OR Premium Lobby Sidebar Navigation */}
        <div className={`flex flex-col gap-6 text-left lg:sticky lg:top-8 transition-all duration-300 ${currentStep === "lobby" ? "lg:col-span-4" : "lg:col-span-6"}`}>
          {currentStep !== "lobby" ? (
            <>
              {/* Sparkly Premium Welcome Badge */}
              <div className="self-start inline-flex items-center gap-2 bg-purple-950/40 border border-purple-500/25 px-4 py-1.5 rounded-full text-[11px] text-purple-300 font-bold tracking-wide shadow-[0_0_20px_rgba(124,58,237,0.15)]">
                <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse shrink-0" />
                <span>Watch Together with Perfect Voice Sync & Distance Meter!</span>
              </div>

              <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.08] text-white">
                Watch together. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-500 to-blue-400">
                  Stay together.
                </span>
              </h2>

              <p className="text-zinc-400 text-sm md:text-base max-w-xl leading-relaxed">
                Nipora is a private watching sanctuary. Watch legal movie streams, live chat, join voice calls, drop emojis, and use our unique <strong className="text-purple-300">Distance Meter</strong> to see how close you feel with your partners while watching from different cities!
              </p>

              {/* Value Propositions List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-purple-950/40 pt-6 mt-2">
                <div className="flex items-start gap-3 text-xs text-zinc-300">
                  <div className="p-1 rounded-lg bg-purple-950/50 border border-purple-900/40 mt-0.5 shrink-0">
                    <Shield className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <div>
                    <span className="font-bold block text-white">🔒 Private Rooms Only</span>
                    Invite-only entry codes for family, friends, or couples.
                  </div>
                </div>
                <div className="flex items-start gap-3 text-xs text-zinc-300">
                  <div className="p-1 rounded-lg bg-blue-950/50 border border-blue-900/40 mt-0.5 shrink-0">
                    <Compass className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div>
                    <span className="font-bold block text-white">📍 Distance Meter</span>
                    Shows real-time distance in kilometers between room members!
                  </div>
                </div>
                <div className="flex items-start gap-3 text-xs text-zinc-300">
                  <div className="p-1 rounded-lg bg-purple-950/50 border border-purple-900/40 mt-0.5 shrink-0">
                    <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <div>
                    <span className="font-bold block text-white">📱 Phone Login + OTP</span>
                    Log in securely using a mobile number and standard OTP.
                  </div>
                </div>
                <div className="flex items-start gap-3 text-xs text-zinc-300">
                  <div className="p-1 rounded-lg bg-blue-950/50 border border-blue-900/40 mt-0.5 shrink-0">
                    <Crown className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
                  </div>
                  <div>
                    <span className="font-bold block text-white">✨ Premium Badges</span>
                    Stand out with a gold border and sparkly user card effects.
                  </div>
                </div>
              </div>

              {/* Testimonial Bubble floating beautifully below */}
              <div className="bg-neutral-900/30 border border-purple-950/30 backdrop-blur-md text-xs text-zinc-400 p-4 rounded-2xl max-w-xs shadow-xl flex items-start gap-2.5 mt-2 self-start relative -rotate-1 transform transition hover:rotate-0 duration-300">
                <Heart className="w-4 h-4 text-purple-500 fill-purple-500/20 shrink-0 mt-0.5" />
                <div>
                  <p className="italic font-light leading-relaxed">"Paresh and I watched Sintel from Ahmedabad & Surat. It showed we are 230 km apart but felt like we sat next to each other!"</p>
                  <span className="text-[10px] text-purple-400 font-mono block mt-1.5 font-bold">— Aanya</span>
                </div>
              </div>
            </>
          ) : (
            /* Premium Side-Navigation Deck */
            <div className="flex flex-col gap-4 bg-neutral-950/80 border border-purple-950/50 p-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] relative overflow-hidden" id="lobby-sidebar">
              <div className="absolute top-0 inset-x-6 h-[1px] bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
              
              <div className="text-left mb-2 px-1">
                <span className="text-[9px] font-black tracking-widest text-purple-400 uppercase">Cinema Center</span>
                <h3 className="text-lg font-black text-white tracking-wide">NIPORA DECK</h3>
              </div>

              <div className="flex flex-col gap-2.5">
                {[
                  { id: "home", label: "Home", icon: "🏠", color: "hover:border-purple-500 hover:bg-purple-950/10 text-purple-200" },
                  { id: "continue", label: "Continue Watching", icon: "❤️", color: "hover:border-rose-500 hover:bg-rose-950/10 text-rose-200" },
                  { id: "create", label: "Create Private Room", icon: "🎬", color: "hover:border-violet-500 hover:bg-violet-950/10 text-violet-200" },
                  { id: "join", label: "Join by Code", icon: "🔗", color: "hover:border-blue-500 hover:bg-blue-950/10 text-blue-200" },
                  { id: "public", label: "Public Watch Parties", icon: "🌍", color: "hover:border-cyan-500 hover:bg-cyan-950/10 text-cyan-200" },
                  { id: "couple", label: "Couple Mode", icon: "💕", color: "hover:border-pink-500 hover:bg-pink-950/10 text-pink-200", badge: "2-Player" },
                ].map((item) => {
                  const isActive = lobbyTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        playCinemaChime();
                        setLobbyTab(item.id as any);
                      }}
                      className={`w-full py-3 px-4 rounded-xl border text-xs font-extrabold flex items-center justify-between transition-all transform duration-200 active:scale-98 ${
                        isActive
                          ? "bg-purple-950/30 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.15)] scale-[1.01]"
                          : `bg-neutral-900/40 border-purple-950/30 text-zinc-400 ${item.color}`
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base shrink-0">{item.icon}</span>
                        <span className="tracking-wide">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[8px] font-black uppercase bg-pink-500/20 text-pink-300 border border-pink-500/30 px-2 py-0.5 rounded-full animate-pulse">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-purple-950/30 text-center">
                <span className="text-[10px] text-zinc-500 font-bold block italic">"Watch Together. Feel Together."</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Interactive Flow Steps Portal */}
        <div className={`w-full flex flex-col gap-6 transition-all duration-300 ${currentStep === "lobby" ? "lg:col-span-8" : "lg:col-span-6"}`}>
          <div className="bg-neutral-950/70 border border-purple-950/50 rounded-3xl p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_40px_rgba(124,58,237,0.02)] relative overflow-hidden">
            
            {/* Bevel glow overlay */}
            <div className="absolute top-0 inset-x-12 h-[1px] bg-gradient-to-r from-transparent via-purple-500/60 to-transparent" />
            
            {/* Step Navigation indicator */}
            <div className="flex items-center gap-2 mb-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              <span className={currentStep === "login" ? "text-purple-400" : ""}>1. Log In</span>
              <ArrowRight className="w-3 h-3" />
              <span className={currentStep === "profile" ? "text-purple-400" : ""}>2. Profile Setup</span>
              <ArrowRight className="w-3 h-3" />
              <span className={currentStep === "lobby" ? "text-purple-400" : ""}>3. Watch Lobby</span>
            </div>

            <AnimatePresence mode="wait">
              
              {/* STEP 1: LOGIN PORTAL */}
              {currentStep === "login" && (
                <motion.div
                  key="step-login"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col gap-5"
                >
                  <div className="text-left">
                    <h3 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
                      <span>Sign in to Nipora</span>
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Choose your favorite method to connect safely.
                    </p>
                  </div>

                  {/* Switch between Google, Phone, and Email */}
                  <div className="flex p-1 bg-neutral-900 border border-purple-950/50 rounded-xl">
                    <button
                      type="button"
                      onClick={() => { setLoginMethod("google"); setOtpSent(false); }}
                      className={`flex-1 py-2 text-[10px] md:text-xs font-bold rounded-lg transition-all ${
                        loginMethod === "google" 
                          ? "bg-purple-950/40 text-purple-200 border border-purple-900/40" 
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      Google Account
                    </button>
                    <button
                      type="button"
                      onClick={() => { setLoginMethod("phone"); setOtpSent(false); }}
                      className={`flex-1 py-2 text-[10px] md:text-xs font-bold rounded-lg transition-all ${
                        loginMethod === "phone" 
                          ? "bg-purple-950/40 text-purple-200 border border-purple-900/40" 
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      Phone OTP
                    </button>
                    <button
                      type="button"
                      onClick={() => { setLoginMethod("email"); setOtpSent(false); }}
                      className={`flex-1 py-2 text-[10px] md:text-xs font-bold rounded-lg transition-all ${
                        loginMethod === "email" 
                          ? "bg-purple-950/40 text-purple-200 border border-purple-900/40" 
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      Email OTP
                    </button>
                  </div>

                  {loginMethod === "google" ? (
                    /* Google Login Button */
                    <div className="flex flex-col gap-4 py-4">
                      <button
                        onClick={handleGoogleLogin}
                        className="w-full relative group overflow-hidden bg-gradient-to-r from-neutral-900 to-zinc-900 border border-zinc-800 text-white font-semibold py-4 rounded-xl shadow-lg hover:border-zinc-700 transition duration-300 flex items-center justify-center gap-3 active:scale-[0.98]"
                        id="google-login-trigger"
                      >
                        <svg className="w-5 h-5 bg-white p-0.5 rounded-full shrink-0" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61c-.29 1.5-.1.3-1.12 3v2.51h1.8c4.51-4.15 7.12-10.27 7.12-17.36z" />
                          <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.86-3c-1.08.72-2.45 1.16-4.1 1.16-3.15 0-5.81-2.13-6.76-5.01H1.31v3.1A12 12 0 0 0 12 24z" />
                          <path fill="#FBBC05" d="M5.24 14.24a7.2 7.2 0 0 1 0-4.48V6.66H1.31a12 12 0 0 0 0 10.68l3.93-3.1z" />
                          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44A12 12 0 0 0 1.31 6.66l3.93 3.1c.95-2.88 3.61-5.01 6.76-5.01z" />
                        </svg>
                        <span className="text-sm tracking-wide">Continue with Google</span>
                      </button>
                      
                      <div className="text-[11px] text-zinc-500 text-center leading-relaxed">
                        Security details are managed directly by Google. Your emails and personal credentials are never stored.
                      </div>
                    </div>
                  ) : loginMethod === "phone" ? (
                    /* Phone Number with simulated OTP Verification */
                    <div className="flex flex-col gap-4 text-left">
                      {!otpSent ? (
                        <form onSubmit={handlePhoneRequestOtp} className="flex flex-col gap-3">
                          <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                            Enter Mobile Number (भारत / Global)
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="bg-neutral-900 border border-zinc-800 px-3.5 py-3 rounded-xl text-sm font-mono text-zinc-400">
                              +91
                            </span>
                            <input
                              type="tel"
                              placeholder="98765 43210"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                              className="flex-1 bg-neutral-900 border border-zinc-800 text-white placeholder-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-900/30 transition text-sm font-mono tracking-wider"
                              required
                            />
                          </div>

                          {otpError && <p className="text-xs text-red-400 mt-1">{otpError}</p>}

                          <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-extrabold py-3.5 rounded-xl shadow-[0_4px_15px_rgba(124,58,237,0.2)] hover:shadow-[0_4px_25px_rgba(124,58,237,0.35)] transition duration-200 mt-2 text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                          >
                            <span>Get OTP (Code bhejein)</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </form>
                      ) : (
                        <form onSubmit={handlePhoneVerifyOtp} className="flex flex-col gap-3">
                          <div className="bg-purple-950/20 border border-purple-900/30 rounded-xl p-3 text-xs text-purple-300 leading-relaxed mb-1 flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-purple-400 animate-pulse" />
                            <div>
                              Simulated OTP is automatically sent to <strong className="text-white">+91 {phoneNumber}</strong>. Please use code <strong className="text-white">290805</strong>.
                            </div>
                          </div>

                          <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                            Enter 6-digit OTP Code
                          </label>
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="Enter Code"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                            className="bg-neutral-900 border border-zinc-800 text-white placeholder-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-900/30 transition text-lg font-mono tracking-widest text-center"
                            required
                          />

                          {otpError && <p className="text-xs text-red-400 mt-1">{otpError}</p>}

                          <button
                            type="submit"
                            disabled={isVerifyingOtp || otpSuccess}
                            className={`w-full font-extrabold py-3.5 rounded-xl shadow-lg transition duration-200 mt-2 text-xs uppercase tracking-wider flex items-center justify-center gap-2 ${
                              otpSuccess 
                                ? "bg-emerald-600 text-white" 
                                : "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-95"
                            }`}
                          >
                            {isVerifyingOtp ? (
                              <>
                                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                <span>Verifying...</span>
                              </>
                            ) : otpSuccess ? (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                <span>Verification Successful!</span>
                              </>
                            ) : (
                              <span>Verify OTP</span>
                            )}
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => setOtpSent(false)}
                            className="text-center text-xs text-purple-400 hover:text-purple-300 mt-1 block"
                          >
                            Resend code to different phone number
                          </button>
                        </form>
                      )}
                    </div>
                  ) : (
                    /* Email Login form with simulated OTP */
                    <div className="flex flex-col gap-4 text-left">
                      {!emailOtpSent ? (
                        <form onSubmit={handleEmailRequestOtp} className="flex flex-col gap-3">
                          <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                            Enter Email Address
                          </label>
                          <input
                            type="email"
                            placeholder="you@example.com"
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            className="bg-neutral-900 border border-zinc-800 text-white placeholder-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-900/30 transition text-sm tracking-wide"
                            required
                          />

                          {otpError && <p className="text-xs text-red-400 mt-1">{otpError}</p>}

                          <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-extrabold py-3.5 rounded-xl shadow-[0_4px_15px_rgba(124,58,237,0.2)] hover:shadow-[0_4px_25px_rgba(124,58,237,0.35)] transition duration-200 mt-2 text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                          >
                            <span>Request Login Code</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </form>
                      ) : (
                        <form onSubmit={handleEmailVerifyOtp} className="flex flex-col gap-3">
                          <div className="bg-purple-950/20 border border-purple-900/30 rounded-xl p-3 text-xs text-purple-300 leading-relaxed mb-1 flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-purple-400 animate-pulse" />
                            <div>
                              Simulated email OTP code sent to <strong className="text-white">{emailInput}</strong>. Please enter <strong className="text-white">123456</strong>.
                            </div>
                          </div>

                          <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                            Enter 6-digit Email OTP
                          </label>
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="123456"
                            value={emailOtpCode}
                            onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, ""))}
                            className="bg-neutral-900 border border-zinc-800 text-white placeholder-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-900/30 transition text-lg font-mono tracking-widest text-center"
                            required
                          />

                          {otpError && <p className="text-xs text-red-400 mt-1">{otpError}</p>}

                          <button
                            type="submit"
                            disabled={isVerifyingEmailOtp || otpSuccess}
                            className={`w-full font-extrabold py-3.5 rounded-xl shadow-lg transition duration-200 mt-2 text-xs uppercase tracking-wider flex items-center justify-center gap-2 ${
                              otpSuccess 
                                ? "bg-emerald-600 text-white" 
                                : "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-95"
                            }`}
                          >
                            {isVerifyingEmailOtp ? (
                              <>
                                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                <span>Verifying...</span>
                              </>
                            ) : otpSuccess ? (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                <span>Email Verified!</span>
                              </>
                            ) : (
                              <span>Confirm Code</span>
                            )}
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => setEmailOtpSent(false)}
                            className="text-center text-xs text-purple-400 hover:text-purple-300 mt-1 block"
                          >
                            Use a different email address
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* STEP 2: PROFILE PROFILE CUSTOMIZER */}
              {currentStep === "profile" && (
                <motion.div
                  key="step-profile"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col gap-5 text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-extrabold tracking-tight text-white">
                        Create Your Watcher Profile
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Choose your cute card details before launching rooms
                      </p>
                    </div>
                    {isPremiumEnabled && (
                      <span className="flex items-center gap-1.5 bg-yellow-400 text-black px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase animate-pulse">
                        <Crown className="w-3.5 h-3.5" />
                        PREMIUM
                      </span>
                    )}
                  </div>

                  <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
                    
                    {/* Cute Avatar trays */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-bold text-purple-300 uppercase tracking-widest flex items-center gap-1.5">
                        <span>Choose Avatar Emoji</span>
                      </label>
                      <div className="grid grid-cols-6 gap-2 bg-neutral-900/60 border border-purple-950 p-2.5 rounded-2xl">
                        {AVATAR_OPTIONS.map((opt) => (
                          <button
                            key={opt.emoji}
                            type="button"
                            onClick={() => {
                              setSelectedAvatar(opt.emoji);
                              setUsername(getNicknameForAvatar(opt.emoji));
                            }}
                            className={`aspect-square rounded-xl text-xl flex items-center justify-center transition transform duration-200 active:scale-90 ${
                              selectedAvatar === opt.emoji
                                ? "bg-neutral-800 border border-purple-500 shadow-[0_0_12px_rgba(124,58,237,0.3)] scale-105"
                                : "hover:bg-neutral-900 border border-transparent"
                            }`}
                          >
                            {opt.emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Nickname selection */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-bold text-purple-300 uppercase tracking-widest">
                        Your Nickname
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Popcorn Master"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="bg-neutral-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-600 transition text-sm font-semibold"
                        required
                      />
                    </div>

                    {/* Color tray */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-bold text-purple-300 uppercase tracking-widest">
                        Select Card Glow Accent Color
                      </label>
                      <div className="flex items-center gap-3 bg-neutral-900/60 border border-purple-950 p-2.5 rounded-2xl justify-between">
                        {COLOR_OPTIONS.map((color) => (
                          <button
                            key={color.hex}
                            type="button"
                            onClick={() => setSelectedColor(color.hex)}
                            className="w-7 h-7 rounded-full flex items-center justify-center transition duration-200 transform active:scale-90 relative hover:scale-110"
                            style={{ backgroundColor: color.hex }}
                          >
                            {selectedColor === color.hex && (
                              <span className="w-2 h-2 rounded-full bg-white shadow" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Bio & Details Form */}
                    <div className="flex flex-col gap-3 border-t border-purple-950/40 pt-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-purple-300 uppercase tracking-widest">
                          Your Bio
                        </label>
                        <textarea
                          placeholder="Tell us about yourself or your favorite watch companion..."
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          className="bg-neutral-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-600 transition text-xs h-16 resize-none font-medium"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-bold text-purple-300 uppercase tracking-widest">
                            Country
                          </label>
                          <select
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="bg-neutral-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-purple-600 transition text-xs font-semibold"
                          >
                            <option value="India">India 🇮🇳</option>
                            <option value="United States">United States 🇺🇸</option>
                            <option value="Nepal">Nepal 🇳🇵</option>
                            <option value="Bangladesh">Bangladesh 🇧🇩</option>
                            <option value="United Kingdom">United Kingdom 🇬🇧</option>
                            <option value="Canada">Canada 🇨🇦</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-bold text-purple-300 uppercase tracking-widest">
                            Language
                          </label>
                          <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="bg-neutral-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-purple-600 transition text-xs font-semibold"
                          >
                            <option value="Hindi">Hindi 🇮🇳</option>
                            <option value="English">English 🇬🇧</option>
                            <option value="Gujarati">Gujarati 🇮🇳</option>
                            <option value="Marathi">Marathi 🇮🇳</option>
                            <option value="Bengali">Bengali 🇮🇳</option>
                            <option value="Tamil">Tamil 🇮🇳</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-bold text-purple-300 uppercase tracking-widest">
                            Fav Genre
                          </label>
                          <select
                            value={favGenre}
                            onChange={(e) => setFavGenre(e.target.value)}
                            className="bg-neutral-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-purple-600 transition text-xs font-semibold"
                          >
                            <option value="Bollywood Romance">Romance 💕</option>
                            <option value="Horror">Horror 👻</option>
                            <option value="Sci-Fi / CGI">Sci-Fi 👽</option>
                            <option value="Comedy / Animation">Comedy 🐰</option>
                            <option value="Action / Thriller">Action ⚡</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-bold text-purple-300 uppercase tracking-widest">
                            Relationship Status
                          </label>
                          <select
                            value={relationshipStatus}
                            onChange={(e) => setRelationshipStatus(e.target.value)}
                            className="bg-neutral-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-purple-600 transition text-xs font-semibold"
                          >
                            <option value="Long Distance Lovebirds">LDR Lovebirds 💖</option>
                            <option value="Married Couples">Married 💍</option>
                            <option value="Just Friends">Just Friends 🍿</option>
                            <option value="Watching with Buddy">Movie Buddy 🤜🤛</option>
                            <option value="Single & Ready to Mingle">Single ✨</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Distance Meter setup */}
                    <div className="flex flex-col gap-2 border-t border-purple-950/40 pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-[11px] font-bold text-blue-300 uppercase tracking-widest flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Distance Meter Location</span>
                          </label>
                          <p className="text-[10px] text-zinc-500 mt-0.5">
                            Show how far apart friends are in kilometers!
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setUseRealLocation(!useRealLocation)}
                          className="text-xs font-bold text-purple-400 hover:text-purple-300"
                        >
                          {useRealLocation ? "Choose City Manually" : "Use Real Geolocation"}
                        </button>
                      </div>

                      {useRealLocation ? (
                        <div className="flex items-center justify-between bg-neutral-900 border border-zinc-800 p-3.5 rounded-xl mt-1">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-purple-400 animate-pulse" />
                            <div className="text-xs">
                              <span className="font-bold block text-zinc-200">
                                {locationStatus === "fetching" ? "Detecting Coordinates..." : locationName}
                              </span>
                              <span className="text-[10px] text-zinc-500 font-mono">
                                {latitude !== undefined ? `${latitude.toFixed(4)}° N, ${longitude?.toFixed(4)}° E` : "Pending GPS Lock..."}
                              </span>
                            </div>
                          </div>
                          {locationStatus === "denied" && (
                            <span className="text-[10px] text-yellow-400 bg-yellow-950/20 px-2 py-1 rounded border border-yellow-900/30">
                              GPS Blocked, using Ahmedabad as Default
                            </span>
                          )}
                          {locationStatus === "fetching" ? (
                            <span className="w-4 h-4 border-2 border-purple-500 border-t-transparent animate-spin rounded-full" />
                          ) : (
                            <button
                              type="button"
                              onClick={fetchUserLocation}
                              className="text-[11px] bg-purple-950/50 hover:bg-purple-900/50 text-purple-200 border border-purple-900/40 px-2.5 py-1 rounded-lg"
                            >
                              Refresh GPS
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2 bg-neutral-900 border border-zinc-800 p-3 rounded-xl mt-1">
                          <span className="text-[10px] text-zinc-500">Pick city to show distance from friends:</span>
                          <div className="grid grid-cols-2 gap-2">
                            {INDIAN_CITIES.map((city, idx) => (
                              <button
                                key={city.name}
                                type="button"
                                onClick={() => setManualCityIndex(idx)}
                                className={`text-xs py-2 px-3 rounded-lg border text-left flex items-center justify-between ${
                                  manualCityIndex === idx
                                    ? "bg-blue-950/40 border-blue-500/80 text-blue-200"
                                    : "bg-zinc-950 border-zinc-900 text-zinc-400 hover:bg-neutral-800/50"
                                }`}
                              >
                                <span>{city.name}</span>
                                {manualCityIndex === idx && <CheckCircle className="w-3.5 h-3.5 text-blue-400" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Premium membership toggle */}
                    <div className="flex items-center justify-between bg-gradient-to-r from-yellow-950/15 to-neutral-900 border border-yellow-900/30 p-3.5 rounded-2xl mt-1">
                      <div className="flex items-start gap-3">
                        <Crown className="w-5 h-5 text-yellow-500 animate-bounce shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-bold block text-yellow-200">Nipora Premium Badge</span>
                          <span className="text-[10px] text-zinc-500 block">Get a gorgeous golden frame & crown in watch sessions!</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsPremiumEnabled(!isPremiumEnabled)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-full border transition duration-200 ${
                          isPremiumEnabled 
                            ? "bg-yellow-500 border-yellow-400 text-black shadow-lg shadow-yellow-500/20" 
                            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        {isPremiumEnabled ? "Active ✨" : "Enable"}
                      </button>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-purple-600 via-purple-700 to-blue-600 text-white font-black py-4 rounded-xl mt-3 shadow-lg flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                    >
                      <span>Proceed to Watch Lobby</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                </motion.div>
              )}

              {/* STEP 3: WATCH ROOMS LOBBY */}
              {currentStep === "lobby" && (
                <motion.div
                  key="step-lobby"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col gap-5 text-left animate-fadeIn"
                >
                  {/* Common Profile Ribbon */}
                  <div className="flex items-center gap-3.5 bg-neutral-900/40 border border-purple-950/40 p-3 rounded-2xl">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl bg-neutral-850 border border-purple-900/50 shadow-inner">
                      {selectedAvatar}
                    </div>
                    <div>
                      <span className="text-xs text-zinc-500 font-medium">Active Watcher</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-white">{username}</span>
                        {isPremiumEnabled && <Crown className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400/10" />}
                        <span className="text-[9px] font-bold text-cyan-400 bg-neutral-950 border border-cyan-950 px-1.5 py-0.5 rounded uppercase tracking-wider">
                          {locationName}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        playCinemaChime();
                        setCurrentStep("profile");
                      }}
                      className="ml-auto text-xs font-extrabold text-purple-400 hover:text-purple-300 bg-purple-950/30 border border-purple-900/30 px-3 py-1.5 rounded-xl hover:border-purple-500 transition duration-300"
                    >
                      Edit Profile
                    </button>
                  </div>

                  {/* TAB 1: HOME */}
                  {lobbyTab === "home" && (
                    <div className="flex flex-col gap-4">
                      <div className="relative rounded-2xl overflow-hidden border border-purple-950/60 p-5 bg-gradient-to-br from-[#0c091f] to-[#040409]">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
                        
                        <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest block mb-1">Interactive Theater</span>
                        <h4 className="text-xl font-black text-white leading-tight">"Nipora – No Distance, Just Together."</h4>
                        <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                          Welcome to the cinematic watch sanctuary. Stream synchronised high-definition legal clips, enjoy lag-free spatial voice lounges, and trigger interactive truths & dares while watching from miles apart!
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2.5">
                          <button
                            type="button"
                            onClick={() => setLobbyTab("create")}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-95 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-purple-950/40"
                          >
                            <span>🎬 Start Watch Party</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setLobbyTab("couple")}
                            className="bg-pink-950/40 border border-pink-500/30 text-pink-300 hover:bg-pink-950/60 text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 transition active:scale-95"
                          >
                            <span>💖 Launch Couple Mode</span>
                          </button>
                        </div>
                      </div>

                      {/* Now Playing Featured Banner */}
                      <div className="border border-purple-950/40 bg-neutral-900/30 rounded-2xl p-4 flex items-center gap-4 hover:border-purple-900/60 transition group">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-950 to-neutral-950 flex items-center justify-center text-xl border border-purple-950 shadow shrink-0">
                          🎬
                        </div>
                        <div className="flex-1 text-left">
                          <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest block">FEATURED NOW</span>
                          <span className="text-sm font-black text-white block mt-0.5 group-hover:text-purple-300 transition">Sintel – Open-Source CGI Fantasy</span>
                          <span className="text-[10px] text-zinc-500 block leading-relaxed mt-1">Ready to sync. Perfect audio/video playback and couple memory timeline tracking!</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setRoomIdInput("SINTEL-SYNC");
                            handleQuickJoinRecent("SINTEL-SYNC");
                          }}
                          className="bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-900 px-3 py-2 rounded-xl text-xs font-extrabold shrink-0"
                        >
                          Watch Now
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: CONTINUE WATCHING */}
                  {lobbyTab === "continue" && (
                    <div className="flex flex-col gap-4">
                      <div>
                        <h4 className="text-xs font-black text-purple-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-purple-400" />
                          <span>❤️ Continue Watching</span>
                        </h4>
                        <p className="text-[11px] text-zinc-500 mt-0.5">Pick up your romantic movie stream right where you left off.</p>
                      </div>

                      {recentRooms.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {recentRooms.map((room) => (
                            <button
                              key={room.roomId}
                              onClick={() => handleQuickJoinRecent(room.roomId)}
                              className="bg-neutral-900/60 hover:bg-neutral-900 border border-purple-950 hover:border-purple-900 p-3.5 rounded-2xl text-left text-xs font-mono flex items-center justify-between transition group"
                            >
                              <div className="flex flex-col gap-0.5">
                                <span className="text-zinc-200 font-bold tracking-wide group-hover:text-purple-300 transition">{room.roomId}</span>
                                <span className="text-[9px] text-zinc-500 font-sans">Active Session</span>
                              </div>
                              <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:translate-x-0.5 transition" />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-neutral-900/20 border border-purple-950/20 p-6 rounded-2xl text-center">
                          <span className="text-2xl block mb-2">🎞️</span>
                          <span className="text-xs font-bold text-zinc-400 block">Aapne abhi tak koi watch party start nahi ki hai!</span>
                          <p className="text-[10px] text-zinc-500 mt-1">Start a private watch party or Couple Mode to see your continue lounge here.</p>
                        </div>
                      )}

                      {/* Scheduled watch list included beautifully */}
                      <div className="border-t border-purple-950/30 pt-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Scheduled Movie Nights</span>
                          <button
                            type="button"
                            onClick={() => setShowScheduleForm(!showScheduleForm)}
                            className="text-[10px] font-bold text-purple-400 hover:text-purple-300 bg-transparent border-none"
                          >
                            {showScheduleForm ? "Cancel" : "+ Schedule New"}
                          </button>
                        </div>

                        {showScheduleForm && (
                          <form onSubmit={handleAddSchedule} className="flex flex-col gap-2.5 bg-neutral-900 border border-purple-950 p-3 rounded-xl">
                            <input
                              type="text"
                              placeholder="Party Title (e.g. Sintel Comedy Night)"
                              value={scheduleTitle}
                              onChange={(e) => setScheduleTitle(e.target.value)}
                              className="bg-neutral-950 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-purple-600"
                              required
                            />
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="e.g. 09:30 PM Today"
                                value={scheduleTime}
                                onChange={(e) => setScheduleTime(e.target.value)}
                                className="flex-1 bg-neutral-950 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-purple-600"
                                required
                              />
                              <button
                                type="submit"
                                className="bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded-lg text-xs font-bold text-white"
                              >
                                Save
                              </button>
                            </div>
                          </form>
                        )}

                        <div className="flex flex-col gap-2">
                          {scheduledParties.map((party) => (
                            <div
                              key={party.id}
                              className="bg-gradient-to-r from-neutral-900 to-[#0e0a1b] border border-purple-950/60 p-3 rounded-xl flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2.5">
                                <Clock className="w-4 h-4 text-purple-400 shrink-0" />
                                <div className="text-left">
                                  <span className="text-xs font-bold block text-zinc-200">{party.title}</span>
                                  <span className="text-[10px] text-zinc-500">Starting at {party.time}</span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteSchedule(party.id)}
                                className="text-[10px] text-zinc-600 hover:text-red-400 p-1 rounded hover:bg-neutral-850"
                              >
                                Cancel
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: CREATE PRIVATE ROOM */}
                  {lobbyTab === "create" && (
                    <div className="flex flex-col gap-4">
                      <div>
                        <h4 className="text-xs font-black text-purple-400 uppercase tracking-widest flex items-center gap-1.5">
                          <span>🎬 Create Private Room</span>
                        </h4>
                        <p className="text-[11px] text-zinc-500 mt-0.5">Launch a customized, invite-only virtual theater with voice lounge.</p>
                      </div>

                      <div className="bg-gradient-to-r from-purple-950/10 to-neutral-900 border border-purple-950/30 p-4 rounded-2xl text-xs leading-relaxed text-zinc-400">
                        <Lock className="w-4 h-4 text-purple-400 shrink-0 inline mr-2 mb-0.5" />
                        You will be configured as the <strong>Lounge Host</strong>. This unlocks full sync permissions, allowing you to load legal media streams, initiate games, and manage participants seamlessly.
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          setIsJoiningExisting(false);
                          setRoomIdInput("");
                          handleLobbySubmit(e);
                        }}
                        className="w-full relative group overflow-hidden bg-gradient-to-r from-purple-600 via-violet-700 to-blue-600 text-white font-extrabold py-4 rounded-xl mt-1 shadow-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-98 transition duration-200"
                        id="create-room-direct-btn"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>Launch Private Watchroom</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* TAB 4: JOIN BY CODE */}
                  {lobbyTab === "join" && (
                    <div className="flex flex-col gap-4">
                      <div>
                        <h4 className="text-xs font-black text-purple-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Key className="w-4 h-4 text-purple-400" />
                          <span>🔗 Join with Room Code</span>
                        </h4>
                        <p className="text-[11px] text-zinc-500 mt-0.5">Enter an invitation code shared by your friends or partner.</p>
                      </div>

                      <form
                        onSubmit={(e) => {
                          setIsJoiningExisting(true);
                          handleLobbySubmit(e);
                        }}
                        className="flex flex-col gap-4"
                      >
                        <input
                          type="text"
                          placeholder="e.g. NIPORA-X9A2F"
                          value={roomIdInput}
                          onChange={(e) => setRoomIdInput(e.target.value)}
                          className="bg-neutral-900 border border-zinc-800 text-white placeholder-zinc-700 rounded-xl px-4 py-3.5 focus:outline-none focus:border-purple-600 transition text-sm font-mono tracking-widest text-center uppercase font-bold"
                          required
                        />

                        <button
                          type="submit"
                          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black py-4 rounded-xl shadow-lg hover:opacity-95 text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-98 transition"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          <span>Join Active Room</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  )}

                  {/* TAB 5: PUBLIC WATCH PARTIES */}
                  {lobbyTab === "public" && (
                    <div className="flex flex-col gap-4">
                      <div>
                        <h4 className="text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Compass className="w-4 h-4 text-cyan-400" />
                          <span>🌍 Public Watch Parties</span>
                        </h4>
                        <p className="text-[11px] text-zinc-500 mt-0.5">Jump into ongoing public watch parties and make new cinephile friends.</p>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5">
                        {[
                          { room: "NIPORA-SINTEL-NIGHT", title: "Sintel Midnight Premiere 🌌", attendees: 48, status: "Playing", distance: "85 km away" },
                          { room: "NIPORA-CGI-MARATHON", title: "Blender CGI Special Showcase 🚀", attendees: 12, status: "Intermission", distance: "192 km away" },
                          { room: "NIPORA-RETRO-LOUNGE", title: "Retro Animation Chillout 🎞️", attendees: 29, status: "Starting soon", distance: "244 km away" }
                        ].map((party) => (
                          <div
                            key={party.room}
                            className="bg-neutral-900/60 border border-purple-950 p-4 rounded-2xl flex items-center justify-between hover:border-cyan-500/40 transition group"
                          >
                            <div className="text-left flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-zinc-100 group-hover:text-cyan-300 transition">{party.title}</span>
                                <span className="text-[8px] bg-cyan-950 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded uppercase font-mono tracking-wider">
                                  {party.status}
                                </span>
                              </div>
                              <span className="text-[10px] text-zinc-500 font-mono">
                                Code: {party.room} • {party.attendees} Watching • {party.distance}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setRoomIdInput(party.room);
                                handleQuickJoinRecent(party.room);
                              }}
                              className="bg-cyan-950/40 hover:bg-cyan-950 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 px-3 py-2 rounded-xl text-xs font-bold transition"
                            >
                              Join Party
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 6: COUPLE MODE */}
                  {lobbyTab === "couple" && (
                    <div className="flex flex-col gap-4">
                      <div className="text-left">
                        <span className="text-[9px] font-black text-pink-400 uppercase tracking-widest block">Exclusive 2-Player Cinema</span>
                        <h4 className="text-lg font-black text-white flex items-center gap-1.5 mt-0.5">
                          <span>💕 Couple Mode Watchroom</span>
                        </h4>
                        <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                          A private room built exclusively for two. Lock out third parties and unlock features made to bring you closer together:
                        </p>
                      </div>

                      {/* Couple features checklist */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 py-1">
                        <div className="bg-[#12070e] border border-pink-950/50 p-3 rounded-xl text-xs text-zinc-300">
                          <span className="font-extrabold block text-pink-300">📅 Anniversary Counter</span>
                          Tracks exactly how many days you both have been together!
                        </div>
                        <div className="bg-[#12070e] border border-pink-950/50 p-3 rounded-xl text-xs text-zinc-300">
                          <span className="font-extrabold block text-pink-300">⏱️ Shared Memory Counter</span>
                          Tracks exact minutes & hours watched side-by-side.
                        </div>
                        <div className="bg-[#12070e] border border-pink-950/50 p-3 rounded-xl text-xs text-zinc-300">
                          <span className="font-extrabold block text-pink-300">❤️ "Miss You" hearts buzzer</span>
                          One tap sends floating romantic heart notifications instantly!
                        </div>
                        <div className="bg-[#12070e] border border-pink-950/50 p-3 rounded-xl text-xs text-zinc-300">
                          <span className="font-extrabold block text-pink-300">📜 Memory Timeline</span>
                          Saves dates, movie logs, and chats forever.
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          setIsJoiningExisting(false);
                          setRoomIdInput("COUPLE-SWEET-ROOM");
                          handleQuickJoinRecent("COUPLE-SWEET-ROOM");
                        }}
                        className="w-full bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 text-white font-black py-4 rounded-xl mt-1 shadow-lg hover:shadow-[0_0_20px_rgba(244,63,94,0.3)] hover:opacity-95 text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-98 transition duration-200"
                      >
                        <Heart className="w-4 h-4 fill-current text-white animate-pulse" />
                        <span>Launch Couple Watchroom 💖</span>
                      </button>
                    </div>
                  )}

                </motion.div>
              )}
              
            </AnimatePresence>

          </div>

          {/* Under benefits (Screenshot 2 footer stats) */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] font-bold text-zinc-500 uppercase tracking-wider py-4 border-t border-purple-950/20">
            <span>🚀 100% Free Hosting</span>
            <span>🔒 Secure Invite Codes</span>
            <span>🗣️ Live Spatial Voice</span>
          </div>
        </div>

      </main>

      {/* Persistent platform indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-neutral-950/80 border border-purple-950/60 px-3.5 py-1.5 rounded-full text-[10px] font-bold text-purple-300 font-mono select-none z-10 shadow-lg">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
        <span>Made with Emergent</span>
      </div>

      {showDownloadModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="bg-[#120716] border border-purple-500/30 max-w-md w-full rounded-2xl p-6 shadow-[0_0_50px_rgba(168,85,247,0.25)] relative text-left">
            <button
              onClick={() => setShowDownloadModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">📥</span>
              <div>
                <h3 className="text-lg font-black tracking-wide text-white uppercase">Download Complete Project</h3>
                <p className="text-xs text-purple-400 font-semibold font-mono">ZIP EXPORT GUIDANCE</p>
              </div>
            </div>

            <div className="space-y-4 text-zinc-300 text-sm">
              <div className="bg-purple-950/20 border border-purple-900/40 p-3.5 rounded-xl space-y-1">
                <span className="font-extrabold text-white text-xs uppercase tracking-wider block text-purple-300">💡 Kyu download nahi ho raha?</span>
                <p className="text-xs leading-relaxed text-zinc-300">
                  Aap abhi **Google AI Studio Chat** ke andar preview use kar rahe hain. Browser security aur sandboxing restrictions ki wajah se Chat के inside direct download triggers block ho jate hain.
                </p>
              </div>

              <div className="space-y-3">
                <span className="font-black text-xs text-white uppercase tracking-wider block">Do aasan tareeqe download karne ke:</span>
                
                <div className="flex items-start gap-3 bg-[#18091e] border border-zinc-900 p-3 rounded-xl">
                  <span className="text-xl shrink-0 mt-0.5">🌐</span>
                  <div>
                    <span className="font-bold text-xs text-white block">Tareeqa 1: Live Tab me open karein (Recommended)</span>
                    <p className="text-xs text-zinc-400 mt-1">
                      Niche diye gaye button par click karke pure application ko nayi window/tab me open karein:
                    </p>
                    <a
                      href="https://ais-dev-7zpzhek72wbuzy24tstjds-612901282613.asia-southeast1.run.app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-purple-400 hover:text-purple-300 font-bold text-xs mt-2 underline"
                    >
                      Open Live App in New Tab ↗
                    </a>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Nayi window me jaakar top right me **"📥 Download Source ZIP"** button dabayein, turant file download ho jayegi!
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-[#18091e] border border-zinc-900 p-3 rounded-xl">
                  <span className="text-xl shrink-0 mt-0.5">⚡</span>
                  <div>
                    <span className="font-bold text-xs text-white block">Tareeqa 2: Direct Source Code Endpoint</span>
                    <p className="text-xs text-zinc-400 mt-1">
                      Agar aap directly download endpoint try karna chahte hain to is link par normal click karein:
                    </p>
                    <a
                      href="/api/download-zip"
                      target="_blank"
                      className="inline-block bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/30 px-3 py-1.5 rounded-lg text-xs font-black text-purple-300 mt-2 transition"
                    >
                      Click to Direct Download 📥
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-purple-950/40 flex justify-end">
              <button
                onClick={() => setShowDownloadModal(false)}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition active:scale-95"
              >
                Samajh Gaya 👍
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
