import { create } from "zustand";
import * as Nakama from "@heroiclabs/nakama-js";

import { gameStore as desenStore } from '../games/Desen/store/gameStore';
import { gameStore as dannegruStore } from '../games/Dannegru/store/gameStore';

export const usePlayerStore = create((set, get) => ({
  // Connection state
  client: null,
  session: null,
  socket: null,
  matchId: null,
  roomCode: "1111",
  
  // UI state
  screen: 0,
  loading: false,
  game: null,
  
  // Game state
  messages: [],
  assignedTitle: "",
  roundOverTrigger: 0,
  users: {},
  owner: null,
  drawingTitles: [],


  setScreen: (step) => set({screen: step, loading: false}),
  setRoomCode: (code) => set({ roomCode: "1111" }),

  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),

  setAssignedTitle: (title) => set({ assignedTitle: title }),

  // 🔗 Initializează client + session + socket (o singură dată)
  initConnection: async () => {
    if (get().socket) return;

    const client = new Nakama.Client(
      "jocuri-server-parola",
      "192.168.1.113",
      "7350",
      false
    );

    let deviceId = localStorage.getItem("device_id");
    if (!deviceId) {
      deviceId = "device-" + Math.random().toString(36).slice(2);
      localStorage.setItem("device_id", deviceId);
    }

    const session = await client.authenticateDevice(deviceId, true);
    const socket = client.createSocket(false, false);
    await socket.connect(session, true);

    socket.onmatchdata = (matchData) => {
      try {
        const json = new TextDecoder().decode(matchData.data);
        const msg = JSON.parse(json);

        console.log("📩 [CLIENT] Received message:", msg.type, msg);
        get().addMessage(msg);
        set({ loading: false });

        switch(msg.type) {
          case "user_data": 
            console.log("[CLIENT] Updating user data for:", msg.content.user_id);
            set((state) => ({
              users: { ...state.users, [msg.content.user_id]: msg.content }
            }));
            break;
            
          case "pick_game":
            console.log("[CLIENT] Game selection screen");
            set({ screen: 2 });
            break;
            
          case "game_selected":
            console.log("[CLIENT] Starting game:", msg.content.game);
            set({ screen: 3, game: msg.content.game });
            break;
            
          default: 
            // Forward to game-specific handlers
            const currentGame = get().game;
            if (currentGame === "desen") {
              desenStore.getState().handleMessage(matchData);
            } else if (currentGame === "dannegru") {
              dannegruStore.getState().handleMessage(matchData);
            }
            break;
        }

      } catch (err) {
        console.error("Parse error:", err);
      }
    };

    socket.onmatchpresence = (presence) => {
      console.log("Presence:", presence);
    };

    set({ client, session, socket });
  },

  // 📤 Send message
  send: (payload) => {
    const { socket, matchId } = get();
    if (!socket || !matchId) {
      console.warn("[CLIENT] Cannot send message: socket or matchId missing");
      return;
    }

    console.log("📤 [CLIENT] Sending message:", payload.type, payload);
    const data = new TextEncoder().encode(JSON.stringify(payload));
    set({ loading: true });
    socket.sendMatchState(matchId, 1, data);
  },

  // 🎮 Join room
  joinRoom: async (name) => {
    const { client, session, socket, roomCode } = get();
    
    if (!client || !session || !socket) {
      console.error("[CLIENT] Cannot join room: missing client/session/socket");
      return;
    }

    try {
      console.log(`[CLIENT] Joining room with code: ${roomCode}`);
      
      const rpc = await client.rpc(session, "join_custom_match", {
        room_code: roomCode
      });

      const match = await socket.joinMatch(rpc.payload.match_id);

      if (match.match_id) {
        console.log(`[CLIENT] Successfully joined match: ${match.match_id}`);
        set({ matchId: match.match_id, screen: 1, loading: false });
        
        // Send user data after a short delay to ensure connection is stable
        setTimeout(() => {
          console.log("[CLIENT] Sending user data to host");
          get().send({
            type: "user_data",
            content: {
              user_id: session.user_id,
              nickname: name,
            }
          });
        }, 500);
      }

      return match.match_id;
    } catch (err) {
      console.error("[CLIENT] Failed to join room:", err);
      throw err;
    }
  }
}));

export const playerStore = {
    getState: usePlayerStore.getState,
    setState: usePlayerStore.setState,
    subscribe: usePlayerStore.subscribe,
};