import { MsgType, ServerMessage } from './messages.js';

enum GameState {
  Connected,
  Naming,
  Matched,
  Playing,
  GameOver,
}

export class Game {
  count = 0;
  onConnected?: () => void;
  onWinCount?: (count: number) => void;
  onMatched?: (opponentName: string) => void;
  onCountDown?: (value: number) => void;
  onPlaying?: () => void;
  onClickCount?: (yourClicks: number, theirClicks: number) => void;
  onGameOver?: (youWon: boolean) => void;

  private ws: WebSocket;
  private state = GameState.Connected;

  constructor(name: string) {
    this.ws = new WebSocket('wss://game.wishbanana.com/', ['wishbanana']);

    this.ws.onopen = () => {
      this.onConnected?.();
    };

    this.ws.onmessage = (event) => {
      let message: ServerMessage;
      try {
        message = JSON.parse(event.data) as ServerMessage;
      } catch {
        return;
      }

      switch (message.id) {
        case MsgType.WINCOUNT:
          this.onWinCount?.(message.count);
          break;

        case MsgType.NAMEPLEASE:
          this.changeState(GameState.Naming)
          this.ws.send(JSON.stringify({ id: MsgType.NAME, name }));
          break;

        case MsgType.MATCHED:
          this.changeState(GameState.Matched)
          this.onMatched?.(message.opponentName);
          break;

        case MsgType.COUNTDOWN:
          if (message.value > 0) {
            this.onCountDown?.(message.value);
            break;
          }
          this.changeState(GameState.Playing)
          this.onPlaying?.();
          break;

        case MsgType.CLICKCOUNT:
          this.count = message.yourCount;
          this.onClickCount?.(message.yourCount, message.theirCount);
          break;

        case MsgType.GAMEOVER:
          this.changeState(GameState.GameOver)
          this.onGameOver?.(message.won);
          this.quit();
          break;
      }
    };
  }

  private changeState(newState: GameState) {
    if (newState - this.state !== 1) {
      return
    }
    console.log(`game state: ${GameState[newState]}`);
    this.state = newState;
  }

  click(): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ id: MsgType.CLICK }));
      this.count++;
    }
  }

  quit(): void {
    this.ws.close();
  }
}
