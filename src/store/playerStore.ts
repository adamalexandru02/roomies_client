import { create } from "zustand";
import * as Nakama from "@heroiclabs/nakama-js";

import { gameStore as desenStore } from '../games/Desen/store/gameStore';
import { gameStore as dannegruStore } from '../games/Dannegru/store/gameStore';

export const usePlayerStore = create((set, get) => ({
  client: null,
  session: null,
  socket: null,
  matchId: null,
  roomCode: "1111",
  messages: [],
  assignedTitle: "",
  roundOverTrigger: 0,
  users: {},
  screen: 0,
  owner: null,
  drawingTitles: [],
  loading: false,


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

        console.log("📩 Received:", msg)
        get().addMessage(msg);
        set({loading: false});

        switch(msg.type) {
          case "user_data": 
            set((state) => ({
              users: { ...state.users, [msg.content.user_id]: msg.content }
            }));
            break;
          case "pick_game":
            set({screen: 2})
            break;
          case "game_selected":
            set({screen: 3, game: msg.content.game});
            break;
          default: 
            switch(get().game) {
              case "desen": desenStore.getState().handleMessage(matchData); break;
              case "dannegru": dannegruStore.getState().handleMessage(matchData); break;
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
    const socket = get().socket;
    const matchId = get().matchId;
    if (!socket || !matchId) return;

    console.log("📩 Sent:", payload)
    const data = new TextEncoder().encode(JSON.stringify(payload));
    set({loading: true});
    socket.sendMatchState(matchId, 1, data);
  },

  // 🎮 Join room
  joinRoom: async (name) => {
    const { client, session, socket, roomCode } = get();
    if (!client || !session || !socket) return;

    try {
      const rpc = await client.rpc(session, "join_custom_match", {
        room_code: roomCode
      });

      const match = await socket.joinMatch(rpc.payload.match_id);

      if (match.match_id) {
        console.log("ha?!");
        setTimeout(() => {
          get().send({
            type: "user_data",
            content: {
              user_id: session.user_id,
              nickname: name,
            }
          });
          set({loading: false})
          
        }, 1000);
      
        set({ matchId: match.match_id, screen: 1, loading: false });
      
      }
      

      return match.match_id;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
}));

export const playerStore = {
    getState: usePlayerStore.getState,
    setState: usePlayerStore.setState,
    subscribe: usePlayerStore.subscribe,
};