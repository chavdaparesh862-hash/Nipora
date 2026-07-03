export interface User {
  userId: string;
  username: string;
  avatar: string;
  color: string;
  joinedAt: number;
  lastPing: number;
  localTime?: number;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  isInVoice?: boolean;
  isMuted?: boolean;
  isCameraOn?: boolean;
  isPremium?: boolean;
  bio?: string;
  country?: string;
  language?: string;
  favGenre?: string;
  relationshipStatus?: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  color: string;
  text: string;
  timestamp: number;
  mediaUrl?: string;
  mediaType?: "gif" | "sticker" | "image" | "voice";
}

export interface RoomState {
  roomId: string;
  videoUrl: string;
  videoTitle: string;
  videoType: "direct" | "youtube";
  isPlaying: boolean;
  currentTime: number;
  lastUpdated: number;
  users: { [userId: string]: User };
  chatHistory: ChatMessage[];
  hostId: string;
  hostPaymentUpi?: string;
  hostPaymentLink?: string;
  ticketPrice?: number;
  ticketEarnings?: number;
  isPremiumEnabled?: boolean;
  launchPhase?: number; // 1 = Watch Together + Chat, 2 = Voice Chat added, 3 = Premium features added
}

export interface FloatingReaction {
  id: string;
  emoji: string;
  username: string;
  color: string;
  x: number; // horizontal starting percentage (20-80)
}

export interface PresetVideo {
  title: string;
  url: string;
  description: string;
  category: string;
  duration?: string;
}
