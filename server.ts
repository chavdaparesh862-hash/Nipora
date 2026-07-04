import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import multer from "multer";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import AdmZip from "adm-zip";

interface User {
  userId: string;
  username: string;
  avatar: string;
  color: string;
  joinedAt: number;
  lastPing: number;
  localTime?: number; // client's local movie playhead time for sync status
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

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  color: string;
  text: string;
  timestamp: number;
}

interface RoomState {
  roomId: string;
  videoUrl: string;
  videoTitle: string;
  videoType: "direct" | "youtube";
  isPlaying: boolean;
  currentTime: number; // base playhead time in seconds
  lastUpdated: number; // server timestamp of last play/pause/seek (ms)
  users: { [userId: string]: User };
  chatHistory: ChatMessage[];
  hostId: string;
  hostPaymentUpi?: string;
  hostPaymentLink?: string;
  ticketPrice?: number;
  ticketEarnings?: number;
  isPremiumEnabled?: boolean;
  launchPhase?: number;
}

const rooms: { [roomId: string]: RoomState } = {};

// Helper to clean up empty rooms periodically
setInterval(() => {
  const now = Date.now();
  for (const roomId in rooms) {
    const room = rooms[roomId];
    // Check if all users have been inactive for more than 1 hour or no users
    const hasUsers = Object.keys(room.users).length > 0;
    const allInactive = Object.values(room.users).every(u => now - u.lastPing > 300000); // 5 minutes inactivity

    if (!hasUsers || (allInactive && now - room.lastUpdated > 3600000)) {
      console.log(`[Server] Cleaning up inactive room: ${roomId}`);
      delete rooms[roomId];
    }
  }
}, 60000);

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = Number(process.env.PORT) || 3000;

  // Custom CORS middleware to support client-only deployments on Netlify/Vercel
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type,Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Ensure uploads directory exists and is served statically
  const uploadDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  app.use("/uploads", express.static(uploadDir));

  // Configure server timeouts to support large and slow file uploads (up to 4GB files)
  server.timeout = 25 * 60 * 1000; // 25 minutes to allow slow connections to finish uploading up to 4GB
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;

  // Background cleanup routine: delete uploaded videos older than 12 hours to prevent disk full failures
  setInterval(() => {
    try {
      if (fs.existsSync(uploadDir)) {
        const files = fs.readdirSync(uploadDir);
        const now = Date.now();
        files.forEach((file) => {
          if (file === ".keep" || file === ".gitkeep") return;
          const filePath = path.join(uploadDir, file);
          const stat = fs.statSync(filePath);
          // 12 hours in milliseconds = 12 * 60 * 60 * 1000 = 43200000
          if (now - stat.mtimeMs > 43200000) {
            fs.unlinkSync(filePath);
            console.log(`[Server] Automatically cleaned up old uploaded video to free disk space: ${file}`);
          }
        });
      }
    } catch (err) {
      console.error("[Server] Old file cleanup error:", err);
    }
  }, 1800000); // Check every 30 minutes

  // Multer Storage config
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, "video-" + uniqueSuffix + ext);
    }
  });

  const upload = multer({
    storage,
    limits: { fileSize: 5120 * 1024 * 1024 } // Support up to 5GB uploads (5120 MB)
  });

  // JSON parsing middleware
  app.use(express.json());

  // API endpoints
  app.post("/api/upload", (req, res, next) => {
    upload.single("video")(req, res, (err) => {
      if (err) {
        console.error("[Server] Multer upload error:", err);
        return res.status(400).json({ error: err.message || "File upload failed (possibly too large)." });
      }
      next();
    });
  }, (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No video file provided" });
      }

      // 5 GB upload limit for all users completely FREE!
      const maxLimit = 5120 * 1024 * 1024; 

      if (req.file.size > maxLimit) {
        // Delete the file if it exceeds the limit to free disk space
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkErr) {
          console.error("[Server] Failed to clean up oversized file:", unlinkErr);
        }
        return res.status(400).json({
          error: "Video exceeds the maximum free limit (5GB). Please select a smaller movie."
        });
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      console.log(`[Server] Video uploaded successfully: ${req.file.filename} (${req.file.size} bytes)`);
      res.json({
        url: fileUrl,
        title: req.file.originalname
      });
    } catch (err) {
      console.error("[Server] Error in video upload:", err);
      res.status(500).json({ error: "Failed to upload video file" });
    }
  });

  // API endpoints
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", roomsCount: Object.keys(rooms).length });
  });

  // Dynamic Source Code ZIP Downloader Endpoint
  app.get("/api/download-zip", (req, res) => {
    try {
      console.log("[Server] Dynamic full source zip export requested by user...");
      const zip = new AdmZip();
      const rootPath = process.cwd();
      
      const addDirRecursive = (currentDir: string, zipRelativePath: string) => {
        const items = fs.readdirSync(currentDir);
        for (const item of items) {
          const fullPath = path.join(currentDir, item);
          const stat = fs.statSync(fullPath);
          
          // Skip node_modules, build outputs, and irrelevant folders
          if (
            item === "node_modules" ||
            item === "dist" ||
            item === ".git" ||
            item === "uploads" ||
            item === ".cache" ||
            item === ".npm"
          ) {
            continue;
          }
          
          if (stat.isDirectory()) {
            addDirRecursive(fullPath, zipRelativePath ? `${zipRelativePath}/${item}` : item);
          } else {
            if (zipRelativePath) {
              zip.addLocalFile(fullPath, zipRelativePath);
            } else {
              zip.addLocalFile(fullPath);
            }
          }
        }
      };
      
      // Start recursive packaging from the project root
      addDirRecursive(rootPath, "");
      
      // Convert zip archive to in-memory buffer
      const zipBuffer = zip.toBuffer();
      
      // Send download response headers
      res.setHeader("Content-Disposition", "attachment; filename=nipora-theatre-source.zip");
      res.setHeader("Content-Type", "application/zip");
      res.send(zipBuffer);
      console.log("[Server] Dynamic full source ZIP compiled and delivered successfully!");
    } catch (error: any) {
      console.error("[Server] Error creating ZIP archive:", error);
      res.status(500).json({ error: "Failed to create source code ZIP", details: error.message });
    }
  });

  // SEO Sitemap dynamic generator for Google Search Console
  app.get("/sitemap.xml", (req, res) => {
    const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
    const host = req.headers.host || "nipora.com";
    const baseUrl = `${protocol}://${host}`;

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

    res.header("Content-Type", "application/xml");
    res.status(200).send(sitemap);
  });

  // SEO Robots.txt generator for Google Search Crawler
  app.get("/robots.txt", (req, res) => {
    const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
    const host = req.headers.host || "nipora.com";
    const baseUrl = `${protocol}://${host}`;

    const robots = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /uploads/

Sitemap: ${baseUrl}/sitemap.xml`;

    res.header("Content-Type", "text/plain");
    res.status(200).send(robots);
  });

  // Get active rooms (for discovery or validation)
  app.get("/api/rooms/:roomId", (req, res) => {
    const { roomId } = req.params;
    if (rooms[roomId]) {
      res.json({ exists: true, usersCount: Object.keys(rooms[roomId].users).length });
    } else {
      res.json({ exists: false, usersCount: 0 });
    }
  });

  // Create standard WebSocket server attached to HTTP server
  const wss = new WebSocketServer({ noServer: true });

  // Handle client connections
  wss.on("connection", (ws: WebSocket) => {
    let currentRoomId = "";
    let currentUserId = "";

    ws.on("message", (messageStr: string) => {
      try {
        const message = JSON.parse(messageStr);
        const { type, payload } = message;

        switch (type) {
          case "join": {
            const { roomId, userId, username, avatar, color } = payload;
            currentRoomId = roomId;
            currentUserId = userId;

            // Initialize room if it doesn't exist
            if (!rooms[roomId]) {
              rooms[roomId] = {
                roomId,
                videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
                videoTitle: "Sintel (Fantasy Animation)",
                videoType: "direct",
                isPlaying: false,
                currentTime: 0,
                lastUpdated: Date.now(),
                users: {},
                chatHistory: [],
                hostId: userId,
                hostPaymentUpi: "",
                hostPaymentLink: "",
                ticketPrice: 0,
                ticketEarnings: 0,
                isPremiumEnabled: true, // Activated by default!
                launchPhase: 3 // All phases unlocked by default!
              };
            }

            const room = rooms[roomId];

            // Add user
            room.users[userId] = {
              userId,
              username: username || "Guest",
              avatar: avatar || "🎬",
              color: color || "#EF4444",
              joinedAt: Date.now(),
              lastPing: Date.now(),
              latitude: payload.latitude,
              longitude: payload.longitude,
              locationName: payload.locationName,
              isInVoice: !!payload.isInVoice,
              isMuted: !!payload.isMuted,
              isCameraOn: !!payload.isCameraOn,
              isPremium: !!payload.isPremium,
              bio: payload.bio,
              country: payload.country,
              language: payload.language,
              favGenre: payload.favGenre,
              relationshipStatus: payload.relationshipStatus
            };

            // Associate room/user metadata with socket
            (ws as any).roomId = roomId;
            (ws as any).userId = userId;

            console.log(`[Server] User ${username} (${userId}) joined room ${roomId}`);

            // Send initial state to the joining user
            const calculatedTime = room.isPlaying
              ? room.currentTime + (Date.now() - room.lastUpdated) / 1000
              : room.currentTime;

            ws.send(JSON.stringify({
              type: "room_state",
              payload: {
                ...room,
                currentTime: calculatedTime
              }
            }));

            // Notify others in room
            broadcastToRoom(roomId, {
              type: "user_joined",
              payload: {
                user: room.users[userId],
                users: room.users
              }
            }, userId);

            // Send system message
            const sysMsg: ChatMessage = {
              id: `sys-${Date.now()}`,
              userId: "system",
              username: "System",
              avatar: "🤖",
              color: "#9CA3AF",
              text: `${username} joined the Watch Party!`,
              timestamp: Date.now()
            };
            room.chatHistory.push(sysMsg);
            if (room.chatHistory.length > 50) room.chatHistory.shift();

            broadcastToRoom(roomId, {
              type: "chat_message",
              payload: sysMsg
            });
            break;
          }

          case "ping": {
            if (currentRoomId && currentUserId && rooms[currentRoomId]) {
              const room = rooms[currentRoomId];
              const user = room.users[currentUserId];
              if (user) {
                user.lastPing = Date.now();
                if (payload) {
                  if (typeof payload.localTime === "number") {
                    user.localTime = payload.localTime;
                  }
                  if (typeof payload.latitude === "number") {
                    user.latitude = payload.latitude;
                  }
                  if (typeof payload.longitude === "number") {
                    user.longitude = payload.longitude;
                  }
                  if (typeof payload.locationName === "string") {
                    user.locationName = payload.locationName;
                  }
                  if (typeof payload.isInVoice === "boolean") {
                    user.isInVoice = payload.isInVoice;
                  }
                  if (typeof payload.isMuted === "boolean") {
                    user.isMuted = payload.isMuted;
                  }
                  if (typeof payload.isCameraOn === "boolean") {
                    user.isCameraOn = payload.isCameraOn;
                  }
                  if (typeof payload.isPremium === "boolean") {
                    user.isPremium = payload.isPremium;
                  }
                }
              }
              // Send back pong with sync comparison info
              ws.send(JSON.stringify({
                type: "pong",
                payload: {
                  serverTime: Date.now(),
                  users: room.users
                }
              }));
            }
            break;
          }

          case "video_control": {
            if (!currentRoomId || !rooms[currentRoomId]) return;
            const room = rooms[currentRoomId];
            const { action, time, url, title, videoType } = payload;

            const now = Date.now();
            if (action === "play") {
              room.isPlaying = true;
              room.currentTime = time;
              room.lastUpdated = now;
            } else if (action === "pause") {
              room.isPlaying = false;
              room.currentTime = time;
              room.lastUpdated = now;
            } else if (action === "seek") {
              room.currentTime = time;
              room.lastUpdated = now;
            } else if (action === "change_video") {
              // Bypassing host restrict so couples can both upload and change videos seamlessly!
              room.videoUrl = url;
              room.videoTitle = title || "Custom Video";
              room.videoType = videoType || "direct";
              room.currentTime = 0;
              room.isPlaying = false;
              room.lastUpdated = now;

              // Send system message about video change
              const changer = room.users[currentUserId]?.username || "Someone";
              const changeMsg: ChatMessage = {
                id: `sys-${Date.now()}`,
                userId: "system",
                username: "System",
                avatar: "🔄",
                color: "#10B981",
                text: `${changer} changed the video to "${room.videoTitle}"`,
                timestamp: Date.now()
              };
              room.chatHistory.push(changeMsg);
              broadcastToRoom(currentRoomId, {
                type: "chat_message",
                payload: changeMsg
              });
            }

            console.log(`[Server] Room ${currentRoomId} Sync: ${action} at ${time}s (by ${currentUserId})`);

            // Broadcast sync update to everyone in room (including or excluding sender depending on client side logic,
            // we'll send it to everyone so they can keep fully in lockstep, but include senderId to let sender choose to skip if appropriate)
            broadcastToRoom(currentRoomId, {
              type: "video_sync",
              payload: {
                action,
                time: room.currentTime,
                isPlaying: room.isPlaying,
                videoUrl: room.videoUrl,
                videoTitle: room.videoTitle,
                videoType: room.videoType,
                lastUpdated: room.lastUpdated,
                senderId: currentUserId
              }
            });
            break;
          }

          case "chat_message": {
            if (!currentRoomId || !rooms[currentRoomId]) return;
            const room = rooms[currentRoomId];
            const user = room.users[currentUserId];
            if (!user) return;

            const chatMsg: ChatMessage = {
              id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              userId: currentUserId,
              username: user.username,
              avatar: user.avatar,
              color: user.color,
              text: payload.text,
              timestamp: Date.now()
            };

            room.chatHistory.push(chatMsg);
            if (room.chatHistory.length > 100) room.chatHistory.shift();

            broadcastToRoom(currentRoomId, {
              type: "chat_message",
              payload: chatMsg
            });
            break;
          }

          case "premium_upgrade": {
            if (currentRoomId && rooms[currentRoomId]) {
              rooms[currentRoomId].isPremiumEnabled = true;
              console.log(`[Server] Room ${currentRoomId} upgraded to PREMIUM!`);
              broadcastToRoom(currentRoomId, {
                type: "room_state",
                payload: rooms[currentRoomId]
              });
            }
            break;
          }

          case "reaction": {
            if (!currentRoomId || !rooms[currentRoomId]) return;
            const room = rooms[currentRoomId];
            const user = room.users[currentUserId];
            if (!user) return;

            broadcastToRoom(currentRoomId, {
              type: "reaction",
              payload: {
                emoji: payload.emoji,
                userId: currentUserId,
                username: user.username,
                color: user.color
              }
            });
            break;
          }

          case "hug_or_nudge": {
            if (!currentRoomId || !rooms[currentRoomId]) return;
            const room = rooms[currentRoomId];
            const user = room.users[currentUserId];
            if (!user) return;

            broadcastToRoom(currentRoomId, {
              type: "hug_or_nudge",
              payload: {
                actionType: payload.actionType, // 'hug' | 'nudge' | 'heart'
                senderId: currentUserId,
                senderName: user.username,
                senderColor: user.color
              }
            });
            break;
          }

          case "update_payment_config": {
            if (!currentRoomId || !rooms[currentRoomId]) return;
            const room = rooms[currentRoomId];
            if (room.hostId !== currentUserId) return; // Only host can change payment info

            const { hostPaymentUpi, hostPaymentLink, ticketPrice } = payload;
            room.hostPaymentUpi = hostPaymentUpi;
            room.hostPaymentLink = hostPaymentLink;
            room.ticketPrice = typeof ticketPrice === "number" ? ticketPrice : 0;

            console.log(`[Server] Room ${currentRoomId} updated payment settings to: UPI=${hostPaymentUpi}, TicketPrice=${ticketPrice}`);

            // Broadcast room state update
            const calculatedTime = room.isPlaying
              ? room.currentTime + (Date.now() - room.lastUpdated) / 1000
              : room.currentTime;

            broadcastToRoom(currentRoomId, {
              type: "room_state",
              payload: {
                ...room,
                currentTime: calculatedTime
              }
            });

            // Send system chat notification
            const sysMsg: ChatMessage = {
              id: `sys-${Date.now()}`,
              userId: "system",
              username: "System",
              avatar: "💰",
              color: "#10B981",
              text: `Host updated room support settings. Ticket price set to ₹${room.ticketPrice}.`,
              timestamp: Date.now()
            };
            room.chatHistory.push(sysMsg);
            broadcastToRoom(currentRoomId, {
              type: "chat_message",
              payload: sysMsg
            });
            break;
          }

          case "change_launch_phase": {
            if (!currentRoomId || !rooms[currentRoomId]) return;
            const room = rooms[currentRoomId];
            
            const { phase } = payload;
            const targetPhase = typeof phase === "number" ? phase : 1;
            room.launchPhase = targetPhase;

            console.log(`[Server] Room ${currentRoomId} Launch Phase changed to Phase ${targetPhase}`);

            // Broadcast room state update
            const calculatedTime = room.isPlaying
              ? room.currentTime + (Date.now() - room.lastUpdated) / 1000
              : room.currentTime;

            broadcastToRoom(currentRoomId, {
              type: "room_state",
              payload: {
                ...room,
                currentTime: calculatedTime
              }
            });

            const phasesDesc = [
              "Phase 1: Watch Together + Chat 🍿",
              "Phase 2: Add Live Voice Chat 🎙️",
              "Phase 3: Premium Features (Tickets, UPI & Distance Meter) 👑"
            ];
            const chosenPhaseDesc = phasesDesc[targetPhase - 1] || `Phase ${targetPhase}`;

            const phaseSysMsg: ChatMessage = {
              id: `sys-${Date.now()}`,
              userId: "system",
              username: "System",
              avatar: "🚀",
              color: "#A78BFA",
              text: `Room Launch Phase changed to: ${chosenPhaseDesc}`,
              timestamp: Date.now()
            };
            room.chatHistory.push(phaseSysMsg);
            broadcastToRoom(currentRoomId, {
              type: "chat_message",
              payload: phaseSysMsg
            });
            break;
          }

          case "send_tip": {
            if (!currentRoomId || !rooms[currentRoomId]) return;
            const room = rooms[currentRoomId];
            const user = room.users[currentUserId];
            if (!user) return;

            const { amount, isTicket } = payload;
            const tipVal = typeof amount === "number" ? amount : 100;
            room.ticketEarnings = (room.ticketEarnings || 0) + tipVal;

            console.log(`[Server] Room ${currentRoomId} received tip: ${tipVal} from ${user.username}`);

            // Broadcast updated room state
            const calculatedTime = room.isPlaying
              ? room.currentTime + (Date.now() - room.lastUpdated) / 1000
              : room.currentTime;

            broadcastToRoom(currentRoomId, {
              type: "room_state",
              payload: {
                ...room,
                currentTime: calculatedTime
              }
            });

            // Send joyful system chat notification
            const alertText = isTicket
              ? `🎟️ ${user.username} bought a Cinema Premium Ticket for ₹${tipVal}! Enjoy the HD movie! 🍿`
              : `💖 ${user.username} sent a direct tipping support of ₹${tipVal}! Thank you! 🎉`;

            const sysMsg: ChatMessage = {
              id: `sys-${Date.now()}`,
              userId: "system",
              username: "System",
              avatar: isTicket ? "🎟️" : "💖",
              color: "#EC4899",
              text: alertText,
              timestamp: Date.now()
            };
            room.chatHistory.push(sysMsg);
            broadcastToRoom(currentRoomId, {
              type: "chat_message",
              payload: sysMsg
            });
            break;
          }

          case "activate_premium": {
            if (!currentRoomId || !rooms[currentRoomId]) return;
            const room = rooms[currentRoomId];
            room.isPremiumEnabled = true;
            console.log(`[Server] Room ${currentRoomId} activated Premium mode`);

            const calculatedTime = room.isPlaying
              ? room.currentTime + (Date.now() - room.lastUpdated) / 1000
              : room.currentTime;

            broadcastToRoom(currentRoomId, {
              type: "room_state",
              payload: {
                ...room,
                currentTime: calculatedTime
              }
            });

            const sysMsg: ChatMessage = {
              id: `sys-${Date.now()}`,
              userId: "system",
              username: "System",
              avatar: "👑",
              color: "#F59E0B",
              text: `👑 Premium high-capacity streaming has been activated in this room! No limit on video file sizes! 🎬`,
              timestamp: Date.now()
            };
            room.chatHistory.push(sysMsg);
            broadcastToRoom(currentRoomId, {
              type: "chat_message",
              payload: sysMsg
            });
            break;
          }

          case "couple_action": {
            if (!currentRoomId || !rooms[currentRoomId]) return;
            const room = rooms[currentRoomId];
            const user = room.users[currentUserId];
            if (!user) return;

            // Broadcast the entire payload so we have clean real-time syncing for couples and custom fun lounge features
            broadcastToRoom(currentRoomId, {
              type: "couple_action",
              payload: {
                ...payload,
                senderId: currentUserId,
                senderName: user.username,
                senderColor: user.color,
                senderAvatar: user.avatar
              }
            });
            break;
          }
        }
      } catch (err) {
        console.error("[Server] Error parsing message:", err);
      }
    });

    ws.on("close", () => {
      if (currentRoomId && currentUserId && rooms[currentRoomId]) {
        const room = rooms[currentRoomId];
        const username = room.users[currentUserId]?.username || "Someone";
        
        console.log(`[Server] User ${username} left room ${currentRoomId}`);
        delete room.users[currentUserId];

        // Transfer host if the leaving user was the host
        if (room.hostId === currentUserId) {
          const remainingKeys = Object.keys(room.users);
          if (remainingKeys.length > 0) {
            room.hostId = remainingKeys[0];
            const nextHost = room.users[room.hostId]?.username || "Someone";
            
            const sysMsgHost: ChatMessage = {
              id: `sys-${Date.now()}-hc`,
              userId: "system",
              username: "System",
              avatar: "👑",
              color: "#F59E0B",
              text: `${nextHost} has been promoted to Room Host!`,
              timestamp: Date.now()
            };
            room.chatHistory.push(sysMsgHost);
          }
        }

        // Notify others
        broadcastToRoom(currentRoomId, {
          type: "user_left",
          payload: {
            userId: currentUserId,
            users: room.users
          }
        });

        // Add system message
        const sysMsg: ChatMessage = {
          id: `sys-${Date.now()}`,
          userId: "system",
          username: "System",
          avatar: "🤖",
          color: "#9CA3AF",
          text: `${username} left the room`,
          timestamp: Date.now()
        };
        room.chatHistory.push(sysMsg);
        broadcastToRoom(currentRoomId, {
          type: "chat_message",
          payload: sysMsg
        });

        // Clean up empty rooms immediately if no users left
        if (Object.keys(room.users).length === 0) {
          console.log(`[Server] Room ${currentRoomId} is now empty. Waiting for interval cleanup or immediate reuse.`);
        }
      }
    });
  });

  // Broadcast function
  function broadcastToRoom(roomId: string, data: any, excludeUserId?: string) {
    const clients = Array.from(wss.clients);
    const payloadStr = JSON.stringify(data);
    clients.forEach((client: any) => {
      if (client.roomId === roomId && client.readyState === WebSocket.OPEN) {
        if (!excludeUserId || client.userId !== excludeUserId) {
          client.send(payloadStr);
        }
      }
    });
  }

  // Handle upgrade header manually
  server.on("upgrade", (request, socket, head) => {
    const protocol = request.headers["sec-websocket-protocol"];
    if (protocol === "vite-hmr") {
      // Let Vite HMR handle its dev connection
      return;
    }
    // Handle our Nipora Movie Sync WebSocket connection (supports both "/" and "/api/ws")
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });

  // Serve static client assets / build in production, or mount Vite middleware in development
  if (process.env.NODE_ENV !== "production") {
    console.log("[Server] Running in DEVELOPMENT mode. Mounting Vite middleware.");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[Server] Running in PRODUCTION mode. Serving dist/ folder.");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Nipora watch party server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("[Server] Failed to start server:", err);
});
