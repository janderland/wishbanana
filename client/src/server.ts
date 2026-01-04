import { createClick, createName, MsgType, ServerMessage } from './messages';
import { Logger, LogLevel } from './logging';

export interface ServerConnection {
  name(name: string): void;
  click(): void;
  close(): void;

  onConnected?: () => void;
  onWinCount?: (count: number) => void;
  onNamePlease?: () => void;
  onMatched?: (opponentName: string) => void;
  onCountDown?: (value: number) => void;
  onClickCount?: (yourClicks: number, theirClicks: number) => void;
  onGameOver?: (youWon: boolean) => void;
  onError?: (data: string) => void;
  onClose?: (code: number, reason: string) => void;
}

export function createServerConnection(
  url: string,
  logger: Logger,
): ServerConnection {
  if (!window.WebSocket) {
    logger.log('WebSockets are not supported.', LogLevel.ERROR);
    throw new Error('WebSockets are not supported.');
  }

  const conn = new WebSocket(url, ['wishbanana']);

  const connection: ServerConnection = {
    name(name: string): void {
      const msg = createName(name);
      const data = JSON.stringify(msg);
      logger.log(data, LogLevel.INFO);
      conn.send(data);
    },

    click(): void {
      const msg = createClick();
      const data = JSON.stringify(msg);
      logger.log(data, LogLevel.INFO);
      conn.send(data);
    },

    close(): void {
      conn.close();
    },
  };

  conn.onopen = () => {
    logger.log('calling onConnected', LogLevel.INFO);
    connection.onConnected?.();
  };

  conn.onmessage = (event) => {
    logger.log(event.data, LogLevel.INFO);

    let message: ServerMessage;
    try {
      message = JSON.parse(event.data) as ServerMessage;
    } catch {
      logger.log('not calling onError', LogLevel.INFO);
      connection.onError?.(event.data);
      return;
    }

    switch (message.id) {
      case MsgType.WINCOUNT:
        logger.log('calling onWinCount', LogLevel.INFO);
        connection.onWinCount?.(message.count);
        break;

      case MsgType.NAMEPLEASE:
        logger.log('calling onNamePlease', LogLevel.INFO);
        connection.onNamePlease?.();
        break;

      case MsgType.MATCHED:
        logger.log('calling onMatched', LogLevel.INFO);
        connection.onMatched?.(message.opponentName);
        break;

      case MsgType.COUNTDOWN:
        logger.log('calling onCountDown', LogLevel.INFO);
        connection.onCountDown?.(message.value);
        break;

      case MsgType.CLICKCOUNT:
        logger.log('calling onClickCount', LogLevel.INFO);
        connection.onClickCount?.(message.yourCount, message.theirCount);
        break;

      case MsgType.GAMEOVER:
        logger.log('calling onGameOver', LogLevel.INFO);
        connection.onGameOver?.(message.won);
        break;

      default:
        logger.log('not calling onError', LogLevel.INFO);
        connection.onError?.(event.data);
    }
  };

  conn.onclose = (event) => {
    logger.log('calling onClose', LogLevel.INFO);
    connection.onClose?.(event.code, event.reason);
  };

  return connection;
}
