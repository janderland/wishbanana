import { createLogger, LogLevel } from './logging.js';
import { createServerConnection } from './server.js';

export interface Game {
  click(): void;
  quit(): void;
  count: number;

  onConnected?: () => void;
  onWinCount?: (count: number) => void;
  onMatched?: (opponentName: string) => void;
  onCountDown?: (value: number) => void;
  onPlaying?: () => void;
  onClickCount?: (yourClicks: number, theirClicks: number) => void;
  onGameOver?: (youWon: boolean) => void;
}

export function createGame(name: string): Game {
  const logger = createLogger('Server');
  // const wsUrl = `ws://${window.location.host}`;
  const wsUrl = `wss://wishbanana.com`;

  let playing = true;
  let state = 0;

  const server = createServerConnection(wsUrl, logger);

  const game: Game = {
    count: 0,

    click(): void {
      if (state === 3) {
        this.count++;
        server.click();
      }
    },

    quit(): void {
      if (playing) {
        server.close();
        playing = false;

        server.onClose = undefined;
        server.onConnected = undefined;
        server.onWinCount = undefined;
        server.onNamePlease = undefined;
        server.onMatched = undefined;
        server.onCountDown = undefined;
        server.onClickCount = undefined;
        server.onGameOver = undefined;
      }
    },
  };

  function changeState(newState: number): boolean {
    if (newState - state === 1) {
      state = newState;
      logger.log(`Game state changed: ${state}`, LogLevel.INFO);
      return true;
    }

    logger.log(
      `Invalid state change requested: ${state} to ${newState}`,
      LogLevel.WARNING,
    );
    return false;
  }

  server.onClose = () => {
    playing = false;
  };

  server.onError = (data) => {
    logger.log(`ERR: ${data}`, LogLevel.ERROR);
  };

  server.onConnected = () => {
    game.onConnected?.();
  };

  server.onWinCount = (count) => {
    game.onWinCount?.(count);
  };

  server.onNamePlease = () => {
    if (changeState(1)) {
      server.name(name);
    }
  };

  server.onMatched = (opponentName) => {
    if (changeState(2)) {
      game.onMatched?.(opponentName);
    }
  };

  server.onCountDown = (value) => {
    if (state !== 2) {
      logger.log(`Received countdown message during state ${state}`, LogLevel.WARNING);
    }

    if (value > 0) {
      game.onCountDown?.(value);
    } else if (changeState(3)) {
      game.onPlaying?.();
    }
  };

  server.onClickCount = (yourClicks, theirClicks) => {
    game.count = yourClicks;
    game.onClickCount?.(yourClicks, theirClicks);
  };

  server.onGameOver = (youWon) => {
    if (changeState(4)) {
      game.onGameOver?.(youWon);
      game.quit();
    }
  };

  return game;
}
