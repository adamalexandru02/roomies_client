import { create } from "zustand";

import { playerStore } from "../../../store/playerStore";

export const useGameStore = create((set, get) => ({

  currentWord: '',
  screen: -1,

  setScreen: (step) => set({screen: step, loading: false}),

  handleMessage (matchData) {
    const {session, setScreen: setPlayerScreen} = playerStore.getState();
    const json = new TextDecoder().decode(matchData.data);
    const msg = JSON.parse(json);

    console.log("📩 Received:", msg)
    set({loading: false});

    switch (msg.type) {
      case "game_started": 
        console.log("ha?!");
        const word = msg.content.word;
        set({ 
          currentWord: word,
          screen: 0
        });
        break;
      case "check_restart":
        set({screen: 1})
      break;
    }
  }

}));

export const gameStore = useGameStore;