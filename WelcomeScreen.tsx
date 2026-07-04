import React, { useState, useEffect } from "react";
import { Sparkles, Heart, Crown, ArrowRight, UserCheck, Key, Shield, Smartphone, Loader2, Phone, Tv } from "lucide-react";
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
  { emoji: "💖", label: "Heart" },
  { emoji: "🎮", label: "Gamer" },
  { emoji: "🌙", label: "Moon" },
  { emoji: "✨", label: "Sparkles" }
];

const COLOR_OPTIONS = [
  { hex: "#EF4444", name: "Romantic Red" },
  { hex: "#EC4899", name: "Dreamy Pink" },
  { hex: "#A78BFA", name: "Cosmic Purple" },
  { hex: "#60A5FA", name: "Electric Blue" },
  { hex: "#10B981", name: "Emerald Mint" },
  { hex: "#F59E0B", name: "Cosmic Amber" }
];

export default function WelcomeScreen({ initialRoomId, onJoin }: WelcomeScreenProps) {
  const [username, setUsername] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("🦊");
  const [selectedColor, setSelectedColor] = useState("#EF4444");
  const [roomId, setRoomId] = useState("");
  const [actionType, setActionType] = useState<"create" | "join">("create");
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [isRoomPremium, setIsRoomPremium] = useState(false);
  const [showLandingPage, setShowLandingPage] = useState(true);

  // Login methods states
  const [loginMethod, setLoginMethod] = useState<"quick" | "phone" | "google">("quick");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  // OTP Countdown timer
  useEffect(() => {
    let timer: any;
    if (otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpCountdown]);

  const handleSendOtp = (e: React.MouseEvent) => {
    e.preventDefault();
    if (phoneNumber.length !== 10) return;
    setIsSendingOtp(true);
    setOtpError("");
    setTimeout(() => {
      setIsSendingOtp(false);
      setOtpSent(true);
      setOtpCountdown(30);
      setOtpCode("1234");
    }, 600);
  };

  const handleVerifyOtp = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) return;
    setIsVerifyingOtp(true);
    setOtpError("");
    setTimeout(() => {
      setIsVerifyingOtp(false);
      // Validate OTP
      if (otpCode === "1234" || otpCode.length === 4) {
        setPhoneVerified(true);
        if (!username) {
          setUsername(`User-${phoneNumber.slice(-4)}`);
        }
      } else {
        setOtpError("Invalid OTP. Try entering '1234' or any 4 digits.");
      }
    }, 600);
  };

  const handleSimulatedGoogleLogin = () => {
    const finalRoomId = roomId.trim() ? roomId.toUpperCase() : "NIPORA-ROOM";
    onJoin(
      "Paresh Chavda",
      "🍿",
      "#EF4444",
      finalRoomId,
      undefined,
      undefined,
      "Virtual Theater",
      isRoomPremium,
      "Couples Movie Night",
      "IN",
      "Hindi/English",
      "Romantic Comedy",
      "Couple"
    );
    setShowGoogleModal(false);
  };

  // Auto-generate a beautiful Room ID on mount or when action shifts to 'create'
  useEffect(() => {
    if (initialRoomId) {
      setRoomId(initialRoomId.toUpperCase());
      setActionType("join");
      setShowLandingPage(false); // Skip landing page directly to join!
    } else {
      const randHex = Math.random().toString(36).substring(2, 7).toUpperCase();
      setRoomId(`NIPORA-${randHex}`);
    }
  }, [initialRoomId]);

  const handleCreateRoomToggle = () => {
    setActionType("create");
    const randHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    setRoomId(`NIPORA-${randHex}`);
  };

  const handleJoinRoomToggle = () => {
    setActionType("join");
    setRoomId("");
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    const finalRoomId = roomId.trim() ? roomId.toUpperCase() : "NIPORA-ROOM";
    
    // Call our parent join hook
    onJoin(
      username.trim(),
      selectedAvatar,
      selectedColor,
      finalRoomId,
      undefined,
      undefined,
      "Virtual Theater",
      isRoomPremium,
      "Couples Movie Night",
      "IN",
      "Hindi/English",
      "Romantic Comedy",
      "Couple"
    );
  };

  if (showLandingPage) {
    return (
      <div className="min-h-screen w-full bg-neutral-950 text-white flex flex-col relative overflow-hidden" id="homepage-root">
        {/* Ambient Glowing Background */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-red-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-pink-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

        {/* Top Header Navbar */}
        <header className="w-full max-w-6xl mx-auto px-6 py-5 flex items-center justify-between relative z-20">
          <NiporaLogo size="sm" showTagline={false} />
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500 font-mono hidden sm:block">STATUS: ONLINE</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-1 max-w-5xl mx-auto px-6 py-12 md:py-20 flex flex-col items-center justify-center text-center relative z-10 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-4 max-w-3xl"
          >
            {/* Promo Pill */}
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm shadow-red-500/5">
              <Heart className="w-3.5 h-3.5 text-red-500 fill-current animate-pulse" />
              <span>Created for Romantic Watch Parties</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight mt-2 text-white">
              Watch Movies Together, <br />
              <span className="bg-gradient-to-r from-red-500 via-pink-500 to-amber-500 bg-clip-text text-transparent">
                Feel Closer Than Ever
              </span>
            </h1>

            <p className="text-sm md:text-base text-zinc-400 max-w-2xl leading-relaxed mt-4">
              The ultimate virtual cozy lounge designed exclusively for couples. Synchronize local video files or streams, talk with high-fidelity live voice & video calls, share location maps, and send instant cute reactions in real-time.
            </p>
          </motion.div>

          {/* Glowing Call to Action block */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 w-full max-w-md shrink-0 justify-center"
          >
            <button
              onClick={() => {
                setActionType("create");
                setShowLandingPage(false);
              }}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest px-8 py-4 rounded-2xl transition-all hover:scale-105 flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-red-600/25"
            >
              <span>🍿 Create Watch Room</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setActionType("join");
                setShowLandingPage(false);
              }}
              className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 hover:border-zinc-700 font-black text-xs uppercase tracking-widest px-8 py-4 rounded-2xl transition-all hover:scale-105 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>👥 Join Partner's Room</span>
            </button>
          </motion.div>

          {/* Bento Feature Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-12 text-left"
          >
            {/* Feature 1 */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-sm rounded-3xl p-6 flex gap-4 hover:border-red-500/30 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-white font-sans">Perfect Playback Sync</h3>
                <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                  Play, pause, seek, and buffer in complete frame lockstep. Your actions instantly sync with your partner's video player, ensuring you watch every single scene together.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-sm rounded-3xl p-6 flex gap-4 hover:border-red-500/30 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                <Phone className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-white font-sans">Cozy Voice & Video Calling</h3>
                <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                  No more switching to separate voice call apps. Talk with high-fidelity chimes, live microphone amplitude meters, and dual-webcam video feeds built directly inside the movie room.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-sm rounded-3xl p-6 flex gap-4 hover:border-red-500/30 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-pink-600/10 border border-pink-500/20 flex items-center justify-center text-pink-400 shrink-0">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-white font-sans">Floating Expressions & Hugs</h3>
                <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                  Express your emotions in real-time. Tap cute emoticons to send beautiful animated floating reactions across your partner's video player, or exchange cozy warm digital hugs.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-sm rounded-3xl p-6 flex gap-4 hover:border-red-500/30 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-white font-sans">Instant Local Sync (Zero Buffer)</h3>
                <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                  No need to wait for heavy video uploads. Simply select the same movie file on your respective devices to join the watch party instantly with zero loading times and zero buffering.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Social Proof Stats */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-[10px] text-zinc-500 uppercase tracking-widest font-mono shrink-0">
            <span>⭐⭐⭐⭐⭐ 4.9 couples average</span>
            <span className="hidden md:inline">•</span>
            <span>⚡ Zero-Buffer Instant Sync</span>
            <span className="hidden md:inline">•</span>
            <span>🔒 Secure & 100% Free Lifetime Promo</span>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full text-center py-6 border-t border-zinc-900 mt-12 relative z-10 text-[10px] text-zinc-600 uppercase tracking-widest font-mono shrink-0">
          © 2026 Nipora Movie Sync. Created for romantic couples worldwide.
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 bg-neutral-950 relative overflow-hidden" id="welcome-canvas">
      {/* Decorative background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Main Container Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-2xl relative z-10 flex flex-col items-center"
        id="welcome-card"
      >
        {/* Logo Section */}
        <div className="mb-6 scale-90 md:scale-100">
          <NiporaLogo size="md" showTagline={true} />
        </div>

        {/* Rebuilt info notice */}
        <div className="w-full bg-zinc-950/80 border border-zinc-800 rounded-2xl px-4 py-3 mb-6 text-center text-xs text-zinc-400 flex flex-col gap-1">
          <span className="text-red-500 font-bold uppercase tracking-wider text-[10px] flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Couple Sync Theater
          </span>
          <p>
            Watch your local movies & video files with your partner in perfect sync!
          </p>
        </div>

        <form onSubmit={handleFormSubmit} className="w-full space-y-5" id="welcome-form">
          {/* 0. Login Method Options */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block">
              Choose Login Method
            </label>
            <div className="grid grid-cols-3 gap-2 bg-zinc-950/80 p-1 rounded-2xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setLoginMethod("quick")}
                className={`py-2 text-[10px] font-bold rounded-xl uppercase tracking-wider transition-all ${
                  loginMethod === "quick"
                    ? "bg-red-600 text-white shadow-md"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                Quick Join
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod("phone")}
                className={`py-2 text-[10px] font-bold rounded-xl uppercase tracking-wider transition-all ${
                  loginMethod === "phone"
                    ? "bg-red-600 text-white shadow-md"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                Phone OTP
              </button>
              <button
                type="button"
                onClick={() => setShowGoogleModal(true)}
                className={`py-2 text-[10px] font-bold rounded-xl uppercase tracking-wider transition-all ${
                  loginMethod === "google"
                    ? "bg-red-600 text-white shadow-md"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                Google Login
              </button>
            </div>
          </div>

          {/* Phone Login Inputs */}
          {loginMethod === "phone" && (
            <div className="space-y-3 bg-zinc-950/40 border border-zinc-800/80 rounded-2xl p-4 animate-fade-in">
              <span className="text-[10px] text-zinc-400 uppercase font-black tracking-widest block">Phone Verification</span>
              
              {!phoneVerified ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      placeholder="Enter 10-digit mobile number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      disabled={otpSent}
                      className="flex-1 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-red-600 focus:outline-none rounded-xl px-3 py-2.5 text-xs text-white tracking-wider"
                    />
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={phoneNumber.length !== 10 || isSendingOtp}
                      className="bg-red-600 hover:bg-red-500 disabled:opacity-45 text-white font-extrabold text-[10px] uppercase px-3.5 rounded-xl transition-all flex items-center gap-1 shrink-0"
                    >
                      {isSendingOtp ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                      <span>{otpSent ? (otpCountdown > 0 ? `Resend (${otpCountdown}s)` : "Resend OTP") : "Get OTP"}</span>
                    </button>
                  </div>

                  {otpSent && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter 4-digit OTP (e.g. 1234)"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        className="flex-1 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-red-600 focus:outline-none rounded-xl px-3 py-2.5 text-xs text-white tracking-widest text-center font-mono font-bold"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={otpCode.length !== 4 || isVerifyingOtp}
                        className="bg-green-600 hover:bg-green-500 disabled:opacity-45 text-neutral-950 font-black text-[10px] uppercase px-4 rounded-xl transition-all flex items-center gap-1 shrink-0"
                      >
                        {isVerifyingOtp ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        <span>Verify</span>
                      </button>
                    </div>
                  )}

                  {otpError && (
                    <span className="text-[10px] text-red-400 font-bold block">{otpError}</span>
                  )}
                  <p className="text-[9px] text-zinc-500 italic">For quick testing, any 4-digit OTP (e.g., 1234) works perfectly!</p>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl px-3 py-2 text-xs">
                  <UserCheck className="w-4 h-4 shrink-0" />
                  <span className="font-extrabold">Phone Verified (+91 {phoneNumber.slice(0, 3)}***{phoneNumber.slice(-3)})</span>
                </div>
              )}
            </div>
          )}

          {/* Google Login Input Indicator */}
          {loginMethod === "google" && (
            <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center font-black text-xs text-neutral-900 border border-zinc-200">
                  G
                </div>
                <div className="text-left">
                  <span className="text-xs font-black text-white block">Connected with Google</span>
                  <span className="text-[9px] text-zinc-500 font-mono">chavdaparesh862@gmail.com</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod("quick");
                  setUsername("");
                }}
                className="text-[9px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold px-2 py-1 rounded uppercase tracking-wide transition-colors"
              >
                Disconnect
              </button>
            </div>
          )}

          {/* 1. Username Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block">
              Your Name
            </label>
            <input
              type="text"
              required
              placeholder="Enter your name (e.g. Paresh)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-zinc-950/90 border border-zinc-800 hover:border-zinc-700 focus:border-red-600 focus:outline-none rounded-2xl px-4 py-3 text-sm text-white font-medium transition-all"
              id="username-field"
            />
          </div>

          {/* 2. Avatar Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block">
              Choose Avatar Emoji
            </label>
            <div className="grid grid-cols-8 gap-2 bg-zinc-950/50 p-2 border border-zinc-800/80 rounded-2xl">
              {AVATAR_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.emoji}
                  onClick={() => setSelectedAvatar(opt.emoji)}
                  className={`text-2xl p-1.5 rounded-xl hover:bg-zinc-800 transition-all ${
                    selectedAvatar === opt.emoji ? "bg-red-600/30 border border-red-500/50 scale-110" : "border border-transparent"
                  }`}
                  title={opt.label}
                >
                  {opt.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Action Type Tabs */}
          <div className="grid grid-cols-2 gap-2 bg-zinc-950/80 p-1.5 rounded-2xl border border-zinc-800">
            <button
              type="button"
              onClick={handleCreateRoomToggle}
              className={`py-2 text-xs font-bold rounded-xl uppercase tracking-wider transition-all ${
                actionType === "create"
                  ? "bg-red-600 text-white shadow-lg"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Create Room
            </button>
            <button
              type="button"
              onClick={handleJoinRoomToggle}
              className={`py-2 text-xs font-bold rounded-xl uppercase tracking-wider transition-all ${
                actionType === "join"
                  ? "bg-red-600 text-white shadow-lg"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Join Room
            </button>
          </div>

          {/* 4. Room ID Display/Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block">
              {actionType === "create" ? "Your New Room Code" : "Enter Partner's Room Code"}
            </label>
            {actionType === "create" ? (
              <div className="w-full bg-zinc-950 border border-dashed border-zinc-800 rounded-2xl px-4 py-3 text-center text-sm font-mono text-red-400 font-extrabold tracking-widest select-all">
                {roomId}
              </div>
            ) : (
              <input
                type="text"
                required
                placeholder="NIPORA-XXXXX"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                className="w-full bg-zinc-950/90 border border-zinc-800 focus:border-red-600 focus:outline-none rounded-2xl px-4 py-3 text-sm font-mono text-center tracking-widest text-red-400 font-bold transition-all"
              />
            )}
            <p className="text-[10px] text-zinc-500 text-center leading-relaxed font-sans">
              {actionType === "create"
                ? "Share this code with your partner so they can join you!"
                : "Ask your partner for their room code to connect."}
            </p>
          </div>

          {/* Pricing Info bar */}
          <div 
            onClick={() => setShowSubscriptionModal(true)}
            className="w-full bg-gradient-to-r from-red-950/30 to-zinc-950 border border-red-900/30 hover:border-red-500/40 rounded-2xl p-3 text-xs flex items-center justify-between cursor-pointer transition-all"
            id="premium-offer-teaser"
          >
            <div className="flex items-center gap-2.5">
              <Crown className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="text-left">
                <span className="font-extrabold text-white block text-[11px] uppercase tracking-wide">
                  Nipora Premium ₹99 {isRoomPremium && "✓ ACTIVE"}
                </span>
                <span className="text-zinc-400 text-[10px]">
                  {isRoomPremium ? "4GB High-capacity active!" : "Increase video upload limit up to 4 GB!"}
                </span>
              </div>
            </div>
            {!isRoomPremium && (
              <span className="text-[10px] bg-red-600/30 text-red-400 border border-red-500/50 font-black px-2 py-1 rounded-lg uppercase tracking-wider">
                Upgrade
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!username.trim() || (loginMethod === "phone" && !phoneVerified)}
            className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold py-3.5 px-4 rounded-2xl transition-all shadow-lg hover:shadow-red-600/20 text-xs uppercase tracking-widest flex items-center justify-center gap-2"
            id="start-theater-btn"
          >
            <span>Enter Movie Theater</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </motion.div>

      {/* Simulated Google OAuth Modal */}
      <AnimatePresence>
        {showGoogleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white text-zinc-900 rounded-3xl w-full max-w-sm p-6 text-center shadow-2xl relative"
            >
              <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4 border border-zinc-200 shadow-sm">
                <span className="text-lg font-black tracking-tighter text-blue-600 font-sans">G</span>
              </div>
              <h3 className="text-base font-extrabold text-zinc-900 tracking-tight">Sign in with Google</h3>
              <p className="text-xs text-zinc-500 mt-1">Select an account to sign in with Nipora Movie Sync</p>
              
              <div className="mt-5 space-y-2">
                <button
                  type="button"
                  onClick={handleSimulatedGoogleLogin}
                  className="w-full bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-2xl p-3 text-left flex items-center gap-3 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-500 to-amber-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                    P
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-bold text-zinc-800 block leading-tight">Paresh Chavda</span>
                    <span className="text-[10px] text-zinc-400 font-medium">chavdaparesh862@gmail.com</span>
                  </div>
                </button>
              </div>

              <div className="mt-6 text-[10px] text-zinc-400 leading-relaxed px-2">
                By continuing, Google shares your profile and email address with Nipora to secure your synced watch parties.
              </div>

              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="text-xs text-zinc-400 hover:text-zinc-600 mt-5 block mx-auto underline font-medium"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Subscription Details Modal */}
      <AnimatePresence>
        {showSubscriptionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            id="premium-modal"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.99 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-6 relative overflow-hidden text-center shadow-2xl"
            >
              {/* Glowing header */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-amber-500 to-red-600" />
              
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
                <Crown className="w-6 h-6 text-amber-500" />
              </div>

              <h3 className="text-lg font-black text-white uppercase tracking-wider">
                Nipora Couple Premium (100% FREE)
              </h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                No payment or subscription required! Stream movies together, upload up to 5 GB files, and enjoy uninterrupted romantic watch parties.
              </p>

              {/* Plans Comparison */}
              <div className="mt-5 space-y-3">
                <div className="bg-green-500/10 p-3.5 rounded-2xl border border-green-500/30 text-left flex justify-between items-center relative">
                  <div className="absolute -top-2.5 right-3 bg-green-500 text-neutral-950 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                    Active Free Plan
                  </div>
                  <div>
                    <span className="text-xs font-black text-green-400 block">Nipora Couple Premium (₹0)</span>
                    <span className="text-[10px] text-zinc-300 font-medium">Up to 5 GB movie uploads, ultra-fast servers, HD quality & zero buffer!</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-zinc-400 line-through block">₹199</span>
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
                  <span className="text-xs font-extrabold text-green-400 block uppercase tracking-wide">Lifetime Premium Promo Applied</span>
                  <p className="text-[10px] text-zinc-400 leading-tight mt-0.5">We have applied the lifetime promo coupon <strong className="text-white font-mono">FREE5GB</strong> automatically! Enjoy HD streaming completely free.</p>
                </div>
              </div>

              {/* Quick unlock button */}
              <button
                type="button"
                onClick={() => {
                  setIsRoomPremium(true);
                  setShowSubscriptionModal(false);
                }}
                className="w-full bg-green-500 hover:bg-green-400 text-neutral-950 font-black py-3.5 rounded-xl mt-5 hover:scale-[1.02] transition-all text-xs uppercase tracking-widest shadow-lg shadow-green-500/10 flex items-center justify-center gap-1.5"
              >
                <Crown className="w-4 h-4" />
                <span>Activate Free 5GB Premium Account Now</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSubscriptionModal(false)}
                className="text-xs text-zinc-500 hover:text-zinc-300 mt-4 underline block mx-auto font-medium"
              >
                Go back
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
