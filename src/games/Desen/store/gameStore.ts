import { create } from "zustand";

import { playerStore } from "../../../store/playerStore";

export const useGameStore = create((set, get) => ({

  assignedTitle: "",
  roundOverTrigger: 0,
  screen: 0,
  owner: null,
  drawingTitles: [],
  loading: false,


  setScreen: (step) => set({screen: step, loading: false}),


  setAssignedTitle: (title) => set({ assignedTitle: title }),

  handleMessage (matchData) {
    const {session, setScreen: setPlayerScreen} = playerStore.getState();
    const json = new TextDecoder().decode(matchData.data);
    const msg = JSON.parse(json);

    console.log("📩 Received:", msg)
    set({loading: false});

    switch (msg.type) {
      case "game_started": 
        console.log("ha?!");
        const myId = session.user_id;
        const myTitle = msg.content.titles[myId];
        set({ 
          assignedTitle: myTitle,
          roundOverTrigger: 0,
          screen: 0,
          owner: null,
          drawingTitles: [],
          loading: false,
        });
        setPlayerScreen(3);
        break;
      case "time_over":
        set({ roundOverTrigger: get().roundOverTrigger + 1 });
      break;
      case "create_titles":
        set({screen: 2, owner: msg.owner})
      break;
      case "start_vote":
        set({screen: 3, drawingTitles: msg.drawingTitles})
      break;
      case "displaying_score":
        set({screen: 4, drawingTitles: msg.drawingTitles})
      break;
      case "check_restart":
        set({screen: 5})
      break;
    }
  }

}));

export const gameStore = useGameStore;