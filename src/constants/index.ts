// Shared constants for the Roomies client application

export const NAKAMA_CONFIG = {
  SERVER_KEY: "jocuri-server-parola",
  HOST: "192.168.1.113",
  PORT: "7350",
  USE_SSL: false,
} as const;

export const GAME_CONFIG = {
  MIN_PLAYERS: 3,
  USER_DATA_DELAY: 500, // ms to wait before sending user data after joining
} as const;

export const MESSAGE_TYPES = {
  USER_DATA: "user_data",
  PICK_GAME: "pick_game",
  GAME_SELECTED: "game_selected",
  ROUND_OVER: "round_over",
} as const;

export const SCREENS = {
  CONNECT: 0,
  WAITING: 1,
  PICKING_GAME: 2,
  GAME: 3,
} as const;
