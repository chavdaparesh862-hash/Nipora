import React, { useState, useEffect, useRef } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { RoomState, FloatingReaction } from "./types";
import WelcomeScreen from "./components/WelcomeScreen";
import PartyRoom from "./components/PartyRoom";

export default function App() {
  const [profile, setProfile] = useState<{
    username: string;
    avatar: string;
    color: string;
    roomId: string;
    isPremium?: boolean;
    latitude?: number;
    longitude?: number;
    locationName?: string;
    bio?: string;
    country?: string;
    language?: string;
    favGenre?: string;
    relationshipStatus?: string;
  } | null>(null);

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [initialRoomId, setInitialRoomId] = useState("");

  const localTimeRef = useRef<number>(0);
  const pingIntervalRef = useRef<number | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  // Expanded refs for interval persistence without reconnects
  const isInVoiceRef = useRef<boolean>(false);
  const isMutedRef = useRef<boolean>(false);
  const isCameraOnRef = useRef<boolean>(false);
  const isPremiumRef = useRef<boolean>(false);
  const latitudeRef = useRef<number | undefined>(undefined);
  const longitudeRef = useRef<number | undefined>(undefined);
  const locationNameRef = useRef<string | undefined>(undefined);

  // States for component consumption
  const [isPremium, setIsPremium] = useState(false);
  const [isInVoice, setIsInVoice] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude?: number; longitude?: number; locationName?: string }>({});

  // Check URL query parameters on initial mount (e.g. ?room=NIPORA-XYZ)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get("room") || params.get("roomId");
    if (roomParam) {
      console.log(`[App] Invitation Link detected for Room: ${roomParam}`);
      setInitialRoomId(roomParam.toUpperCase());
    }
  }, []);

  // Set up connection once profile is selected
  useEffect(() => {
    if (!profile) return;

    let wsInstance: WebSocket | null = null;
    let isMounted = true;

    const connectWebSocket = () => {
      if (!isMounted) return;
      setConnectionStatus("connecting");

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}`;
      console.log(`[App] Connecting WebSocket to: ${wsUrl}`);

      wsInstance = new WebSocket(wsUrl);

      wsInstance.onopen = () => {
        if (!isMounted) return;
        console.log("[App] WebSocket connection opened successfully");
        setConnectionStatus("connected");

        // Join room immediately with profile details
        wsInstance?.send(
          JSON.stringify({
            type: "join",
            payload: {
              roomId: profile.roomId,
              userId: getOrGenerateUserId(),
              username: profile.username,
              avatar: profile.avatar,
              color: profile.color,
              latitude: latitudeRef.current,
              longitude: longitudeRef.current,
              locationName: locationNameRef.current,
              isPremium: isPremiumRef.current,
              isInVoice: isInVoiceRef.current,
              isMuted: isMutedRef.current,
              isCameraOn: isCameraOnRef.current,
              bio: profile.bio,
              country: profile.country,
              language: profile.language,
              favGenre: profile.favGenre,
              relationshipStatus: profile.relationshipStatus
            }
          })
        );

        // Schedule periodic ping loop to sync and check presence (every 4 seconds)
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = window.setInterval(() => {
          if (wsInstance?.readyState === WebSocket.OPEN) {
            wsInstance.send(
              JSON.stringify({
                type: "ping",
                payload: { 
                  localTime: localTimeRef.current,
                  latitude: latitudeRef.current,
                  longitude: longitudeRef.current,
                  locationName: locationNameRef.current,
                  isPremium: isPremiumRef.current,
                  isInVoice: isInVoiceRef.current,
                  isMuted: isMutedRef.current,
                  isCameraOn: isCameraOnRef.current
                }
              })
            );
          }
        }, 4000);
      };

      wsInstance.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const message = JSON.parse(event.data);
          const { type, payload } = message;

          switch (type) {
            case "room_state": {
              setRoomState(payload);
              // Synced Room Code update in browser URL bar to allow copy-pasting URL directly
              const currentUrl = new URL(window.location.href);
              if (currentUrl.searchParams.get("room") !== payload.roomId) {
                currentUrl.searchParams.set("room", payload.roomId);
                window.history.pushState({}, "", currentUrl.toString());
              }
              break;
            }

            case "user_joined":
            case "user_left": {
              setRoomState((prev) => {
                if (!prev) return null;
                return {
                  ...prev,
                  users: payload.users
                };
              });
              break;
            }

            case "pong": {
              // Update partner presence locally
              setRoomState((prev) => {
                if (!prev) return null;
                return {
                  ...prev,
                  users: payload.users
                };
              });
              break;
            }

            case "video_sync": {
              setRoomState((prev) => {
                if (!prev) return null;
                return {
                  ...prev,
                  videoUrl: payload.videoUrl,
                  videoTitle: payload.videoTitle,
                  videoType: payload.videoType,
                  isPlaying: payload.isPlaying,
                  currentTime: payload.time,
                  lastUpdated: payload.lastUpdated
                };
              });
              break;
            }

            case "chat_message": {
              setRoomState((prev) => {
                if (!prev) return null;
                return {
                  ...prev,
                  chatHistory: [...prev.chatHistory, payload].slice(-100)
                };
              });
              break;
            }

            case "reaction": {
              const { emoji, username, color } = payload;
              const newReaction = {
                id: `react-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                emoji,
                username,
                color,
                x: 15 + Math.random() * 70 // starting layout column offset % (15% to 85%)
              };
              setReactions((prev) => [...prev, newReaction]);

              // Garbage collection of reactions to keep DOM lightweight
              setTimeout(() => {
                setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
              }, 4500);
              break;
            }
          }
        } catch (err) {
          console.error("[App] Socket parse message error:", err);
        }
      };

      wsInstance.onclose = () => {
        if (!isMounted) return;
        console.log("[App] WebSocket disconnected. Scheduling auto-reconnect.");
        setConnectionStatus("disconnected");
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

        // Attempt automatic reconnect after 3 seconds
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = window.setTimeout(connectWebSocket, 3000);
      };

      wsInstance.onerror = (err) => {
        console.error("[App] WebSocket error:", err);
        wsInstance?.close();
      };

      setSocket(wsInstance);
    };

    connectWebSocket();

    return () => {
      isMounted = false;
      if (wsInstance) {
        wsInstance.close();
      }
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [profile]);

  // Read or create unique visitor identity
  const getOrGenerateUserId = (): string => {
    let uid = localStorage.getItem("nipora_user_id");
    if (!uid) {
      uid = `user-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("nipora_user_id", uid);
    }
    return uid;
  };

  // Trigger sync actions from video element controls
  const handleSyncAction = (action: "play" | "pause" | "seek", time: number) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(
      JSON.stringify({
        type: "video_control",
        payload: {
          action,
          time
        }
      })
    );
  };

  // Emit emoji triggers
  const handleTriggerReaction = (emoji: string) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(
      JSON.stringify({
        type: "reaction",
        payload: { emoji }
      })
    );
  };

  return (
    <div className="w-full min-h-screen bg-neutral-950 text-white font-sans selection:bg-red-600/30">
      {/* 1. Offline Toast Alert banner */}
      <AnimatePresence>
        {profile && connectionStatus !== "connected" && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-4 right-4 z-50 flex items-center justify-between bg-zinc-900 border border-red-500/50 backdrop-blur-md text-red-200 px-4 py-3 rounded-2xl shadow-xl max-w-md mx-auto"
            id="reconnect-toast"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <div className="text-xs">
                <span className="font-bold block">Connecting to Theater...</span>
                {connectionStatus === "connecting"
                  ? "Establishing websocket handshake..."
                  : "Sync server offline. Reconnecting in 3s..."}
              </div>
            </div>
            <RefreshCw className="w-4 h-4 animate-spin text-red-400" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Screen Routing Switch */}
      {!profile ? (
        <WelcomeScreen
          initialRoomId={initialRoomId}
          onJoin={(username, avatar, color, roomId, lat, lng, locName, premium, bio, country, language, favGenre, relationshipStatus) => {
            if (lat !== undefined) latitudeRef.current = lat;
            if (lng !== undefined) longitudeRef.current = lng;
            if (locName !== undefined) locationNameRef.current = locName;
            isPremiumRef.current = !!premium;
            setIsPremium(!!premium);
            if (lat !== undefined || lng !== undefined || locName !== undefined) {
              setUserLocation({ latitude: lat, longitude: lng, locationName: locName });
            }
            setProfile({ 
              username, 
              avatar, 
              color, 
              roomId, 
              isPremium: !!premium,
              latitude: lat,
              longitude: lng,
              locationName: locName,
              bio,
              country,
              language,
              favGenre,
              relationshipStatus
            });
          }}
        />
      ) : roomState ? (
        <PartyRoom
          roomState={roomState}
          userId={getOrGenerateUserId()}
          socket={socket}
          onSyncAction={handleSyncAction}
          localTimeRef={localTimeRef}
          reactions={reactions}
          onTriggerReaction={handleTriggerReaction}
          isPremium={isPremium}
          setIsPremium={(premium) => {
            isPremiumRef.current = premium;
            setIsPremium(premium);
          }}
          isInVoice={isInVoice}
          setIsInVoice={(val) => {
            isInVoiceRef.current = val;
            setIsInVoice(val);
          }}
          isMuted={isMuted}
          setIsMuted={(val) => {
            isMutedRef.current = val;
            setIsMuted(val);
          }}
          isCameraOn={isCameraOn}
          setIsCameraOn={(val) => {
            isCameraOnRef.current = val;
            setIsCameraOn(val);
          }}
          userLocation={userLocation}
          setUserLocation={(loc) => {
            if (loc.latitude !== undefined) latitudeRef.current = loc.latitude;
            if (loc.longitude !== undefined) longitudeRef.current = loc.longitude;
            if (loc.locationName !== undefined) locationNameRef.current = loc.locationName;
            setUserLocation(loc);
          }}
        />
      ) : (
        /* Loading splash */
        <div className="min-h-screen flex flex-col items-center justify-center text-center gap-4 bg-neutral-950" id="cinema-loader">
          <div className="w-14 h-14 rounded-full border-4 border-zinc-800 border-t-red-600 animate-spin" />
          <h2 className="text-lg font-bold text-zinc-300 animate-pulse">
            Entering Nipora Cinema Hall...
          </h2>
          <p className="text-xs text-zinc-500 font-mono">
            Buffering network streams and establishing frame sync
          </p>
        </div>
      )}
    </div>
  );
}
