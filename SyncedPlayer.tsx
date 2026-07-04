import React, { useRef, useEffect, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, RotateCw, AlertCircle, RefreshCw, Sun, Moon, Sparkles, Upload } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { FloatingReaction } from "../types";

interface SyncedPlayerProps {
  videoUrl: string;
  videoTitle?: string;
  videoType?: string;
  isPlaying: boolean;
  currentTime: number;
  lastUpdated: number;
  senderId?: string;
  onSyncAction: (action: "play" | "pause" | "seek", time: number) => void;
  localTimeRef: React.MutableRefObject<number>;
  reactions: FloatingReaction[];
  localFileBlobUrl?: string | null;
  onSetLocalFileBlobUrl?: (url: string | null) => void;
}

function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export default function SyncedPlayer({
  videoUrl,
  videoTitle,
  videoType,
  isPlaying,
  currentTime,
  lastUpdated,
  onSyncAction,
  localTimeRef,
  reactions,
  localFileBlobUrl,
  onSetLocalFileBlobUrl
}: SyncedPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isRemoteUpdate = useRef<boolean>(false);

  const [localPlay, setLocalPlay] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [sliderTime, setSliderTime] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.8);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isDrifting, setIsDrifting] = useState<boolean>(false);
  const controlsTimeoutRef = useRef<number | null>(null);

  // Video rotation & skip duration customizations
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  const [skipAmount, setSkipAmount] = useState<number>(10); // user custom skip time
  const [brightness, setBrightness] = useState<number>(100); // 10% to 100% brightness
  const [showVolumeSlider, setShowVolumeSlider] = useState<boolean>(false);
  const [showBrightnessSlider, setShowBrightnessSlider] = useState<boolean>(false);

  // Persistent consecutive drift checks to enforce robust sync
  const driftCountRef = useRef<number>(0);

  // YouTube Specific States and Refs
  const ytPlayerRef = useRef<any>(null);
  const [ytReady, setYtReady] = useState<boolean>(false);
  const isYoutube = !!getYouTubeId(videoUrl);

  // Initialize and load YouTube Player API
  useEffect(() => {
    const ytId = getYouTubeId(videoUrl);
    if (!ytId) {
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch (e) {}
        ytPlayerRef.current = null;
      }
      setYtReady(false);
      return;
    }

    // Load global iframe API if missing
    if (!(window as any).YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    let player: any;
    const initPlayer = () => {
      const playerEl = document.getElementById("yt-player-el");
      if (!playerEl) return;
      
      player = new (window as any).YT.Player("yt-player-el", {
        videoId: ytId,
        playerVars: {
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          origin: window.location.origin
        },
        events: {
          onReady: (event: any) => {
            ytPlayerRef.current = player;
            setYtReady(true);
            setDuration(player.getDuration() || 100);
            
            // Initial sync
            let targetTime = currentTime;
            if (isPlaying) {
              const elapsed = (Date.now() - lastUpdated) / 1000;
              if (elapsed > 0 && elapsed < 3600) targetTime = currentTime + elapsed;
              player.playVideo();
              setLocalPlay(true);
            } else {
              player.pauseVideo();
              setLocalPlay(false);
            }
            player.seekTo(targetTime, true);
          },
          onStateChange: (event: any) => {
            // YT states: 1 = playing, 2 = paused
            const state = event.data;
            if (state === 1) {
              setLocalPlay(true);
              if (isRemoteUpdate.current) {
                isRemoteUpdate.current = false;
                return;
              }
              onSyncAction("play", player.getCurrentTime());
            } else if (state === 2) {
              setLocalPlay(false);
              if (isRemoteUpdate.current) {
                isRemoteUpdate.current = false;
                return;
              }
              onSyncAction("pause", player.getCurrentTime());
            }
          }
        }
      });
    };

    const checkAndInit = () => {
      if ((window as any).YT && (window as any).YT.Player) {
        initPlayer();
      } else {
        setTimeout(checkAndInit, 150);
      }
    };

    checkAndInit();

    return () => {
      if (player) {
        try {
          player.destroy();
        } catch (e) {}
      }
    };
  }, [videoUrl, localFileBlobUrl]);

  // Sync state from server to local player (HTML5 or YouTube)
  useEffect(() => {
    let targetTime = currentTime;
    if (isPlaying) {
      const elapsed = (Date.now() - lastUpdated) / 1000;
      if (elapsed > 0 && elapsed < 3600) {
        targetTime = currentTime + elapsed;
      }
    }

    if (isYoutube) {
      const yt = ytPlayerRef.current;
      if (!yt || !ytReady) return;

      try {
        const diff = Math.abs(yt.getCurrentTime() - targetTime);
        if (diff > 1.8) {
          isRemoteUpdate.current = true;
          yt.seekTo(targetTime, true);
          setSliderTime(targetTime);
        }

        const ytState = yt.getPlayerState();
        if (isPlaying && ytState !== 1) {
          isRemoteUpdate.current = true;
          yt.playVideo();
          setLocalPlay(true);
        } else if (!isPlaying && ytState === 1) {
          isRemoteUpdate.current = true;
          yt.pauseVideo();
          setLocalPlay(false);
        }
      } catch (e) {}
    } else {
      const video = videoRef.current;
      if (!video) return;

      const diff = Math.abs(video.currentTime - targetTime);
      if (diff > 1.5) {
        isRemoteUpdate.current = true;
        video.currentTime = targetTime;
        setSliderTime(targetTime);
      }

      if (isPlaying && video.paused) {
        isRemoteUpdate.current = true;
        video.play().catch(() => {});
        setLocalPlay(true);
      } else if (!isPlaying && !video.paused) {
        isRemoteUpdate.current = true;
        video.pause();
        setLocalPlay(false);
      }
    }
  }, [videoUrl, localFileBlobUrl, isPlaying, currentTime, lastUpdated, ytReady, isYoutube]);

  const handleForceResync = () => {
    let targetTime = currentTime;
    if (isPlaying) {
      const elapsed = (Date.now() - lastUpdated) / 1000;
      if (elapsed > 0 && elapsed < 3600) {
        targetTime = currentTime + elapsed;
      }
    }

    if (isYoutube) {
      const yt = ytPlayerRef.current;
      if (yt && ytReady) {
        isRemoteUpdate.current = true;
        yt.seekTo(targetTime, true);
        if (isPlaying) yt.playVideo(); else yt.pauseVideo();
      }
    } else {
      const video = videoRef.current;
      if (video) {
        isRemoteUpdate.current = true;
        video.currentTime = targetTime;
        if (isPlaying) video.play().catch(() => {}); else video.pause();
      }
    }
    setSliderTime(targetTime);
    setIsDrifting(false);
  };

  // Monitor drifting state & auto-resync to maintain 100% perfect match
  useEffect(() => {
    const checkDrift = () => {
      let targetTime = currentTime;
      if (isPlaying) {
        const elapsed = (Date.now() - lastUpdated) / 1000;
        if (elapsed > 0 && elapsed < 3600) {
          targetTime = currentTime + elapsed;
        }
      }

      let currentVal = 0;
      if (isYoutube) {
        if (ytPlayerRef.current && ytReady) {
          try {
            currentVal = ytPlayerRef.current.getCurrentTime();
          } catch (e) {}
        }
      } else {
        if (videoRef.current) {
          currentVal = videoRef.current.currentTime;
        }
      }
      
      const diff = Math.abs(currentVal - targetTime);
      const isDriftingNow = diff > 2.2;
      setIsDrifting(isDriftingNow);

      if (isDriftingNow) {
        driftCountRef.current += 1;
        // If out of sync for more than 2 checks (~3 seconds), force automatic resync
        if (driftCountRef.current >= 2) {
          console.log("[SyncedPlayer] Out of sync. Forcing automatic resync...");
          handleForceResync();
          driftCountRef.current = 0;
        }
      } else {
        driftCountRef.current = 0;
      }
    };

    const interval = setInterval(checkDrift, 1500);
    return () => clearInterval(interval);
  }, [isPlaying, currentTime, lastUpdated, isYoutube, ytReady]);

  // Dynamic ticking of timeline slider
  useEffect(() => {
    if (isYoutube) {
      if (!ytReady || !ytPlayerRef.current) return;
      const interval = setInterval(() => {
        try {
          const time = ytPlayerRef.current.getCurrentTime();
          localTimeRef.current = time;
          setSliderTime(time);
          setDuration(ytPlayerRef.current.getDuration() || 100);
        } catch (e) {}
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isYoutube, ytReady]);

  // HTML5 Time update tick
  const handleHTML5TimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    localTimeRef.current = video.currentTime;
    setSliderTime(video.currentTime);
  };

  // Local play toggle
  const handlePlayToggle = () => {
    if (isYoutube) {
      const yt = ytPlayerRef.current;
      if (yt && ytReady) {
        try {
          const state = yt.getPlayerState();
          if (state === 1) {
            onSyncAction("pause", yt.getCurrentTime());
          } else {
            onSyncAction("play", yt.getCurrentTime());
          }
        } catch (e) {}
      }
      return;
    }

    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      onSyncAction("play", video.currentTime);
    } else {
      onSyncAction("pause", video.currentTime);
    }
  };

  // Slider change trigger
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    setSliderTime(targetTime);
    localTimeRef.current = targetTime;

    if (isYoutube) {
      const yt = ytPlayerRef.current;
      if (yt && ytReady) {
        isRemoteUpdate.current = true;
        yt.seekTo(targetTime, true);
        onSyncAction("seek", targetTime);
      }
      return;
    }

    const video = videoRef.current;
    if (!video) return;
    video.currentTime = targetTime;
    onSyncAction("seek", targetTime);
  };

  // HTML5 Player handlers
  const handleLocalPlay = () => {
    setLocalPlay(true);
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }
    if (videoRef.current) {
      onSyncAction("play", videoRef.current.currentTime);
    }
  };

  const handleLocalPause = () => {
    setLocalPlay(false);
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }
    if (videoRef.current) {
      onSyncAction("pause", videoRef.current.currentTime);
    }
  };

  const handleLocalSeeked = () => {
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }
    if (videoRef.current) {
      onSyncAction("seek", videoRef.current.currentTime);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (localPlay) setShowControls(false);
    }, 4000);
  };

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [localPlay]);

  // Hide individual sliders when general control layout hides
  useEffect(() => {
    if (!showControls) {
      setShowVolumeSlider(false);
      setShowBrightnessSlider(false);
    }
  }, [showControls]);

  // Monitor device orientation to automatically enter fullscreen when rotated to landscape on mobile!
  useEffect(() => {
    const handleOrientationChange = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
      if (isLandscape && isMobile) {
        const container = containerRef.current;
        if (container && !document.fullscreenElement) {
          container.requestFullscreen().catch((err) => {
            console.warn("Fullscreen auto-trigger on rotation failed:", err);
          });
        }
      }
    };

    window.addEventListener("resize", handleOrientationChange);
    if (window.screen && window.screen.orientation) {
      window.screen.orientation.addEventListener("change", handleOrientationChange);
    }
    
    // Run once on load in case already in landscape
    handleOrientationChange();

    return () => {
      window.removeEventListener("resize", handleOrientationChange);
      if (window.screen && window.screen.orientation) {
        window.screen.orientation.removeEventListener("change", handleOrientationChange);
      }
    };
  }, []);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (isYoutube) {
      const yt = ytPlayerRef.current;
      if (yt && ytReady) {
        if (nextMuted) yt.mute(); else yt.unMute();
      }
      return;
    }

    const video = videoRef.current;
    if (video) video.muted = nextMuted;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    const nextMuted = val === 0;
    setIsMuted(nextMuted);

    if (isYoutube) {
      const yt = ytPlayerRef.current;
      if (yt && ytReady) {
        yt.setVolume(val * 100);
        if (nextMuted) yt.mute(); else yt.unMute();
      }
      return;
    }

    const video = videoRef.current;
    if (video) {
      video.volume = val;
      video.muted = nextMuted;
    }
  };

  const toggleFullScreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch((err) => {
        console.error("Fullscreen error:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleSkip = (seconds: number) => {
    let current = sliderTime;
    let newTime = current + seconds;
    if (newTime < 0) newTime = 0;
    if (newTime > duration) newTime = duration;

    setSliderTime(newTime);
    localTimeRef.current = newTime;

    if (isYoutube) {
      const yt = ytPlayerRef.current;
      if (yt && ytReady) {
        isRemoteUpdate.current = true;
        yt.seekTo(newTime, true);
        onSyncAction("seek", newTime);
      }
      return;
    }

    const video = videoRef.current;
    if (video) {
      video.currentTime = newTime;
      onSyncAction("seek", newTime);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-video bg-black rounded-2xl overflow-hidden group border transition-all duration-1000 ${
        localPlay
          ? "shadow-[0_0_60px_rgba(167,139,250,0.18)] border-purple-900/50"
          : "shadow-2xl border-zinc-800/80"
      }`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => localPlay && setShowControls(false)}
      id="synced-player-container"
    >
      <div 
        className="w-full h-full transition-all duration-300 ease-out flex items-center justify-center overflow-hidden"
        style={{ 
          transform: `rotate(${rotation}deg) ${rotation === 90 || rotation === 270 ? 'scale(1.778)' : 'scale(1)'}` 
        }}
        id="rotatable-player-wrapper"
      >
        {isYoutube ? (
          /* YouTube Synced Video Component */
          <div className="w-full h-full flex items-center justify-center bg-black" id="youtube-embed-container">
            <div id="yt-player-el" className="w-full h-full pointer-events-none scale-105" />
          </div>
        ) : (
          /* HTML5 Video Element */
          <video
            ref={videoRef}
            src={videoType === "local" ? (localFileBlobUrl || "") : videoUrl}
            className="w-full h-full object-contain"
            onTimeUpdate={handleHTML5TimeUpdate}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            onPlay={handleLocalPlay}
            onPause={handleLocalPause}
            onSeeked={handleLocalSeeked}
            playsInline
            id="cinema-video"
          />
        )}
      </div>

      {/* Dynamic Brightness Overlay (reduces eye strain for couples in dark rooms) */}
      <div
        className="absolute inset-0 pointer-events-none transition-colors duration-150 z-[1]"
        style={{ backgroundColor: `rgba(0,0,0,${1 - brightness / 100})` }}
        id="player-brightness-shrub"
      />

      {/* Floating Reactions Overlay Canvas */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" id="reactions-overlay">
        <AnimatePresence>
          {reactions.map((reaction) => (
            <motion.div
              key={reaction.id}
              initial={{ y: "100%", x: `${reaction.x}%`, scale: 0.5, opacity: 0 }}
              animate={{
                y: "-20%",
                x: [
                  `${reaction.x}%`,
                  `${reaction.x + (Math.sin(parseInt(reaction.id.substr(-3), 16) || 0) * 15)}%`,
                  `${reaction.x - (Math.cos(parseInt(reaction.id.substr(-3), 16) || 0) * 10)}%`,
                  `${reaction.x}%`
                ],
                scale: [0.6, 1.4, 1.2, 0.9],
                opacity: [0, 1, 1, 0]
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 4.5, ease: "easeOut" }}
              className="absolute bottom-0 text-4xl flex flex-col items-center filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
            >
              <span>{reaction.emoji}</span>
              <span
                className="text-[9px] font-semibold text-white bg-black/75 px-1.5 py-0.5 rounded-full mt-1 border border-white/10"
                style={{ borderColor: `${reaction.color}30` }}
              >
                {reaction.username}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Play/Pause Center Hub (Fades on play) */}
      <AnimatePresence>
        {!localPlay && (!isYoutube || ytReady) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] cursor-pointer"
            onClick={handlePlayToggle}
            id="player-center-overlay"
          >
            <div className="w-16 h-16 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-[0_0_25px_rgba(168,85,247,0.5)] transition duration-300 transform hover:scale-110">
              <Play className="w-8 h-8 fill-current translate-x-0.5" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drift/OutOfSync Banner */}
      <AnimatePresence>
        {isDrifting && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between bg-purple-950/90 border border-purple-600/50 backdrop-blur-md text-purple-100 px-4 py-2.5 rounded-xl shadow-xl"
            id="drift-banner"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-purple-400 shrink-0" />
              <div className="text-xs md:text-sm">
                <span className="font-bold">Playback delay detected.</span> You are out of sync with your partner's timeline.
              </div>
            </div>
            <button
              onClick={handleForceResync}
              className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-black text-xs font-bold px-3 py-1.5 rounded-lg shadow-md transition duration-200"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "3s" }} />
              Sync Now
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left Vertical Volume Control (Cinema-style, smaller and only shown on touch/click) */}
      <div
        className={`absolute left-4 bottom-20 bg-zinc-950/95 backdrop-blur-md border border-purple-500/30 rounded-2xl py-3 px-2 flex flex-col items-center gap-2 transition-all duration-300 z-30 shadow-[0_10px_30px_rgba(0,0,0,0.8)] ${
          showControls && showVolumeSlider ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4 pointer-events-none"
        }`}
        id="left-vertical-volume"
      >
        <button
          onClick={toggleMute}
          className="p-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-white transition-colors"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400 animate-pulse" /> : <Volume2 className="w-3.5 h-3.5 text-purple-400" />}
        </button>
        <div className="relative flex flex-col items-center">
          <input
            type="range"
            orient="vertical"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="h-20 w-1 accent-purple-600 bg-zinc-800 rounded-lg appearance-none cursor-pointer [writing-mode:bt-lr] [-webkit-appearance:slider-vertical]"
            title="Volume"
          />
        </div>
        <span className="text-[9px] font-mono font-black text-purple-400 w-8 text-center mt-0.5">
          {isMuted ? "0" : Math.round(volume * 100)}%
        </span>
      </div>

      {/* Right Vertical Brightness Control (Cinema-style, smaller and only shown on touch/click) */}
      <div
        className={`absolute right-4 bottom-20 bg-zinc-950/95 backdrop-blur-md border border-yellow-500/30 rounded-2xl py-3 px-2 flex flex-col items-center gap-2 transition-all duration-300 z-30 shadow-[0_10px_30px_rgba(0,0,0,0.8)] ${
          showControls && showBrightnessSlider ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4 pointer-events-none"
        }`}
        id="right-vertical-brightness"
      >
        <div className="p-1.5 rounded-lg bg-zinc-900/80 text-yellow-400">
          <Sun className="w-3.5 h-3.5" />
        </div>
        <div className="relative flex flex-col items-center">
          <input
            type="range"
            orient="vertical"
            min="10"
            max="100"
            step="5"
            value={brightness}
            onChange={(e) => setBrightness(Number(e.target.value))}
            className="h-20 w-1 accent-yellow-500 bg-zinc-800 rounded-lg appearance-none cursor-pointer [writing-mode:bt-lr] [-webkit-appearance:slider-vertical]"
            title="Brightness"
          />
        </div>
        <span className="text-[9px] font-mono font-black text-yellow-400 w-8 text-center mt-0.5">
          {brightness}%
        </span>
      </div>

      {/* Control Skin Backdrop Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/50 transition-opacity duration-300 pointer-events-none ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Beautiful Customized Control Bar Overlay */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-4 flex flex-col gap-3 transition-opacity duration-300 z-10 ${
          showControls ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        id="custom-player-controls"
      >
        {/* Playhead Progress Bar and Timers */}
        <div className="flex items-center gap-3 w-full" id="timeline-controls-row">
          <span className="text-[11px] font-mono font-medium text-gray-300 w-10 text-right">
            {formatTime(sliderTime)}
          </span>
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={sliderTime}
            onChange={handleSliderChange}
            className="flex-1 accent-purple-600 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer hover:h-2 transition-all duration-150"
          />
          <span className="text-[11px] font-mono font-medium text-gray-300 w-10 text-left">
            {formatTime(duration)}
          </span>
        </div>

        {/* Media Buttons Row */}
        <div className="flex items-center justify-between w-full" id="buttons-controls-row">
          <div className="flex items-center gap-4">
            {/* Play/Pause Toggle */}
            <button
              onClick={handlePlayToggle}
              className="p-1.5 rounded-full hover:bg-zinc-800 text-white transition-colors"
              title={localPlay ? "Pause" : "Play"}
            >
              {localPlay ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            {/* Quick skips & custom time selector */}
            <div className="flex items-center gap-1 bg-zinc-900/60 hover:bg-zinc-900/95 border border-zinc-800/80 rounded-xl p-1 transition-all">
              {/* Skip Backward */}
              <button
                onClick={() => handleSkip(-skipAmount)}
                className="p-1 rounded-lg hover:bg-zinc-800 text-gray-300 hover:text-white transition-colors"
                title={`Backward ${skipAmount}s`}
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Custom Skip Amount Input/Selector */}
              <div className="relative flex items-center gap-1 px-1">
                <input
                  type="number"
                  min="1"
                  max="3600"
                  value={skipAmount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 10;
                    setSkipAmount(Math.max(1, Math.min(3600, val)));
                  }}
                  className="w-10 bg-zinc-950 border border-zinc-800/80 rounded px-1.5 py-0.5 text-[10px] font-black text-center text-purple-400 focus:outline-none focus:border-purple-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  title="Set custom skip seconds"
                />
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">s</span>
              </div>

              {/* Skip Forward */}
              <button
                onClick={() => handleSkip(skipAmount)}
                className="p-1 rounded-lg hover:bg-zinc-800 text-gray-300 hover:text-white transition-colors"
                title={`Forward ${skipAmount}s`}
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            {/* Interactive Volume Toggle Status Button */}
            <button
              onClick={() => {
                setShowVolumeSlider(!showVolumeSlider);
                setShowBrightnessSlider(false);
              }}
              className={`p-1.5 rounded-full hover:bg-zinc-800 text-gray-300 hover:text-white transition-colors flex items-center gap-1 text-[11px] font-bold px-2 border transition-all ${
                showVolumeSlider ? "bg-purple-600/20 border-purple-500/50 text-purple-400" : "border-zinc-800/50"
              }`}
              title="Toggle Volume Slider"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-purple-400" />}
              <span className="hidden xs:inline">Vol: {isMuted ? "0" : Math.round(volume * 100)}%</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Direct Sync Info Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 bg-zinc-900/95 border border-zinc-800 px-3 py-1 rounded-full text-[10px] text-zinc-400">
              <div className={`w-1.5 h-1.5 rounded-full ${localPlay ? "bg-purple-500 animate-pulse" : "bg-zinc-600"}`} />
              {localPlay ? (isYoutube ? "YouTube Live" : "Local Streaming") : "Paused"}
            </div>

            {/* Force Sync button */}
            <button
              onClick={handleForceResync}
              className="p-1.5 rounded-full hover:bg-zinc-800 text-gray-300 hover:text-white transition-colors flex items-colors gap-1 text-xs px-2.5 border border-zinc-800"
              title="Recalibrate and Resync Timeline"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Resync</span>
            </button>

            {/* Rotation Control Button */}
            <button
              onClick={() => {
                const nextRotation = (rotation + 90) % 360;
                setRotation(nextRotation);
                // Auto-enter fullscreen for landscape rotation formats (90 or 270)
                if (nextRotation === 90 || nextRotation === 270) {
                  const container = containerRef.current;
                  if (container && !document.fullscreenElement) {
                    container.requestFullscreen().catch((err) => {
                      console.warn("Fullscreen error on video rotation:", err);
                    });
                  }
                }
              }}
              className="p-1.5 rounded-full hover:bg-zinc-800 text-gray-300 hover:text-white transition-colors flex items-center gap-1 text-[10px] font-black"
              title="Rotate video 90 degrees"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>{rotation}°</span>
            </button>

            {/* Interactive Brightness Toggle Button */}
            <button
              onClick={() => {
                setShowBrightnessSlider(!showBrightnessSlider);
                setShowVolumeSlider(false);
              }}
              className={`flex items-center gap-1 bg-zinc-900 hover:bg-zinc-800 border rounded-full px-2.5 py-1 text-[10px] font-bold text-zinc-400 transition-all ${
                showBrightnessSlider ? "border-yellow-500/50 text-yellow-400 bg-yellow-500/10" : "border-zinc-800/80"
              }`}
              title="Toggle Brightness Slider"
            >
              <Sun className="w-3 h-3 text-yellow-400 shrink-0" />
              <span>{brightness}%</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullScreen}
              className="p-1.5 rounded-full hover:bg-zinc-800 text-white transition-colors"
              title="Toggle Fullscreen"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* If the current movie is a Local Sync and we don't have the local file loaded, prompt the user */}
      {videoType === "local" && !localFileBlobUrl && (
        <div className="absolute inset-0 z-30 bg-zinc-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center gap-4 animate-fade-in" id="local-file-select-prompt">
          <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center animate-pulse">
            <Sparkles className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-purple-400">⚡ Local Instant Sync Mode</h3>
            <p className="text-sm font-black text-white mt-2 max-w-sm px-4">
              Your partner has loaded <span className="text-purple-400 font-mono">"{videoTitle || "a local movie"}"</span>
            </p>
            <p className="text-[11px] text-zinc-400 mt-1 max-w-xs leading-relaxed px-4 mx-auto">
              Please select the same file on your device to join the synced watch party instantly with zero buffering and zero delay!
            </p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-widest px-6 py-3 rounded-xl transition-all hover:scale-105 flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-600/20"
          >
            <Upload className="w-4 h-4" />
            <span>Select Paired Movie File</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && onSetLocalFileBlobUrl) {
                const blobUrl = URL.createObjectURL(file);
                onSetLocalFileBlobUrl(blobUrl);
              }
            }}
            accept="video/*"
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
