// Shared types for the Roomies client application

export interface User {
  user_id: string;
  username: string;
  nickname?: string;
  avatar?: string;
  isDisconnected?: boolean;
  lastDisconnectedAt?: number;
}

export interface GameMessage {
  type: string;
  content?: any;
}

export interface UserDataMessage extends GameMessage {
  type: "user_data";
  content: {
    user_id: string;
    nickname: string;
    avatar?: string;
  };
}

export interface PickGameMessage extends GameMessage {
  type: "pick_game";
}

export interface GameSelectedMessage extends GameMessage {
  type: "game_selected";
  content: {
    game: string;
  };
}

export type GameType = "desen" | "dannegru";

export type Screen = 0 | 1 | 2 | 3; // Connect | Waiting | Picking | Game

export interface PlayerStoreState {
  // Connection
  client: any;
  session: any;
  socket: any;
  matchId: string | null;
  roomCode: string;
  
  // UI
  screen: Screen;
  loading: boolean;
  game: GameType | null;
  
  // Game state
  messages: GameMessage[];
  users: Record<string, User>;
  assignedTitle: string;
  roundOverTrigger: number;
  owner: string | null;
  drawingTitles: any[];
  
  // Actions
  setScreen: (screen: Screen) => void;
  setRoomCode: (code: string) => void;
  addMessage: (msg: GameMessage) => void;
  setAssignedTitle: (title: string) => void;
  initConnection: () => Promise<void>;
  send: (payload: GameMessage) => void;
  joinRoom: (name: string) => Promise<string | undefined>;
}
