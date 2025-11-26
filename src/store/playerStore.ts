import { create } from "zustand";
import * as Nakama from "@heroiclabs/nakama-js";

export const usePlayerStore = create((set, get) => ({
  client: null,
  session: null,
  socket: null,
  matchId: null,
  roomCode: "",
  messages: [],
  assignedTitle: "",
  roundOverTrigger: 0,
  users: {},
  screen: 0,
  owner: null,
  drawingTitles: [],
  loading: false,


  setScreen: (step) => set({screen: step, loading: false}),
  setRoomCode: (code) => set({ roomCode: code }),

  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),

  setAssignedTitle: (title) => set({ assignedTitle: title }),

  // 🔗 Initializează client + session + socket (o singură dată)
  initConnection: async () => {
    if (get().socket) return;

    const client = new Nakama.Client(
      "jocuri-server-parola",
      "192.168.1.109",
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

        if (msg.type === "game_started") {
          const myId = get().session.user_id;
          const myTitle = msg.content.titles[myId];
          set({ assignedTitle: myTitle, screen: 3});
        }

        if (msg.type === "user_data") {
          set((state) => ({
            users: { ...state.users, [msg.content.user_id]: msg.content }
          }));
        }

        if (msg.type === "time_over") {
              set({ roundOverTrigger: get().roundOverTrigger + 1 });
        }

        if (msg.type === "create_titles") {
          set({screen: 5, owner: msg.owner})
        }

        if (msg.type === "start_vote") {
          set({screen: 6, drawingTitles: msg.drawingTitles})
        }

        if (msg.type === "displaying_score") {
          set({screen: 7, drawingTitles: msg.drawingTitles})
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
  joinRoom: async () => {
    const { client, session, socket, roomCode } = get();
    if (!client || !session || !socket) return;

    try {
      const rpc = await client.rpc(session, "join_custom_match", {
        room_code: roomCode
      });

      const match = await socket.joinMatch(rpc.payload.match_id);
      set({ matchId: match.match_id });

      return match.match_id;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
}));
