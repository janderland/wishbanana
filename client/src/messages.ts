// Message protocol types matching server/message.ts
// These must stay in sync with the server

export enum MsgType {
  MATCHED,
  COUNTDOWN,
  CLICK,
  GAMEOVER,
  NAME,
  NAMEPLEASE,
  CLICKCOUNT,
  WINCOUNT,
}

export type WinCount = {
  id: MsgType.WINCOUNT;
  count: number;
};

export type NamePlease = {
  id: MsgType.NAMEPLEASE;
};

export type Name = {
  id: MsgType.NAME;
  name: string;
};

export type Matched = {
  id: MsgType.MATCHED;
  opponentName: string;
};

export type CountDown = {
  id: MsgType.COUNTDOWN;
  value: number;
};

export type Click = {
  id: MsgType.CLICK;
};

export type ClickCount = {
  id: MsgType.CLICKCOUNT;
  yourCount: number;
  theirCount: number;
};

export type GameOver = {
  id: MsgType.GAMEOVER;
  won: boolean;
};

export type ServerMessage =
  | WinCount
  | NamePlease
  | Matched
  | CountDown
  | ClickCount
  | GameOver;

export type ClientMessage = Name | Click;

export type Message = ServerMessage | ClientMessage;
