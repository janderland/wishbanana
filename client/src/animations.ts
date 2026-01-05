import { $, hide, show } from './dom.js';

// The angle (degrees) reached by the hand when the
// winning number of clicks is reached.
const MAX_ANGLE = 20;

// The duration (milliseconds) of the flashes during
// gameplay.
const FLASH_DURATION = 100;

// The duration (seconds) of each part of the hand's
// animation.
const PLAYING_TRANS_TIME = 0.2;
const LOSING_TRANS_TIME = 1;
const RAISING_TRANS_TIME = 1.3;
const SMASHING_TRANS_TIME = 0.2;

type AnimationState =
  | { type: 'PLAYING'; progress: number }
  | { type: 'LOSING' }
  | { type: 'RAISING' }
  | { type: 'SMASHING' };

type UpdatePositionFn = (
  hand: HTMLElement,
  container: HTMLElement,
  state: AnimationState,
) => void;

class HandAnimation {
  // Current state of the animation for a hand.
  private state: AnimationState = { type: 'PLAYING', progress: 0 };

  // ID of the timeout used during the game over animation.
  private timeoutId = 0;

  // This method is attached as an event handler
  // to detect window resizing. We need to retain
  // a reference to it so we can remove it when
  // the game ends.
  private resizeHandler: () => void;

  constructor(
    private hand: HTMLElement,
    private smasher: HTMLElement,
    private container: HTMLElement,
    private updatePosition: UpdatePositionFn,
  ) {
    this.resizeHandler = () =>
      this.updatePosition(this.hand, this.container, this.state);
  }

  updateProgress(p: number): void {
    if (this.state.type !== 'PLAYING') {
      return;
    }
    this.state = { type: 'PLAYING', progress: p };
    this.updatePosition(this.hand, this.container, this.state);
  }

  runWinAnimation(complete?: () => void): void {
    clearTimeout(this.timeoutId);
    this.updateState({ type: 'RAISING' });

    this.timeoutId = window.setTimeout(() => {
      this.updateState({ type: 'SMASHING' });
      this.timeoutId = window.setTimeout(() => {
        hide(this.hand);
        show(this.smasher);
        complete?.();
      }, SMASHING_TRANS_TIME * 1000);
    }, RAISING_TRANS_TIME * 1000);
  }

  runLoseAnimation(complete?: () => void): void {
    clearTimeout(this.timeoutId);
    this.updateState({ type: 'LOSING' });

    this.timeoutId = window.setTimeout(() => {
      hide(this.hand);
      complete?.();
    }, LOSING_TRANS_TIME * 1000);
  }

  reset(): void {
    this.updateState({ type: 'PLAYING', progress: 0 });
    show(this.hand);
    hide(this.smasher);
  }

  attachResizeHandler(): void {
    window.addEventListener('resize', this.resizeHandler);
  }

  detachResizeHandler(): void {
    window.removeEventListener('resize', this.resizeHandler);
  }

  private updateState(s: AnimationState): void {
    this.state = s;
    this.updatePosition(this.hand, this.container, this.state);
  }
}

function updateYourPosition(
  hand: HTMLElement,
  container: HTMLElement,
  state: AnimationState,
): void {
  let x: number, y: number, a: number;

  switch (state.type) {
    case 'PLAYING': {
      const progress = state.progress;
      const totalX = container.offsetHeight - hand.offsetHeight;
      y = -totalX * progress;
      x = -(hand.offsetWidth / 4) * progress;
      a = -MAX_ANGLE * progress;
      hand.style.transform = `translate(${x}px, ${y}px) rotate(${a}deg)`;
      hand.style.transition = `transform ${PLAYING_TRANS_TIME}s ease-in`;
      break;
    }

    case 'LOSING':
      // Because the #gameContainer is 40vmax tall and centered, 30% of the
      // window height plus the fist's height should get the fist off the screen
      y = window.innerHeight * 0.3 + hand.offsetHeight;
      hand.style.transform = `translate(0, ${y}px)`;
      hand.style.transition = `transform ${LOSING_TRANS_TIME}s ease-out`;
      break;

    case 'RAISING':
      y = -(container.offsetHeight - hand.offsetHeight / 2);
      x = -hand.offsetWidth / 2;
      hand.style.transform = `translate(${x}px, ${y}px) rotate(${-MAX_ANGLE}deg)`;
      hand.style.transition = `transform ${RAISING_TRANS_TIME}s ease-in`;
      break;

    case 'SMASHING':
      y = -(container.offsetHeight / 2 - hand.offsetHeight / 2);
      x = container.offsetWidth / 2 - hand.offsetWidth / 2;
      hand.style.transform = `translate(${x}px, ${y}px)`;
      hand.style.transition = `transform ${SMASHING_TRANS_TIME}s ease-out`;
      break;
  }
}

function updateTheirPosition(
  hand: HTMLElement,
  container: HTMLElement,
  state: AnimationState,
): void {
  const MARGIN_BOTTOM = 0.25; // 25%
  let x: number, y: number, a: number;

  switch (state.type) {
    case 'PLAYING': {
      const progress = state.progress;
      const totalX = container.offsetHeight * (1 - MARGIN_BOTTOM) - hand.offsetHeight;
      y = -totalX * progress;
      x = (hand.offsetWidth / 4) * progress;
      a = MAX_ANGLE * progress;
      hand.style.transform = `translate(${x}px, ${y}px) rotate(${a}deg)`;
      hand.style.transition = `transform ${PLAYING_TRANS_TIME}s ease-in`;
      break;
    }

    case 'LOSING':
      // Because the #gameContainer is 40vmax tall and centered, 30% of the
      // window height plus the fist's height should get the fist off the screen
      y = window.innerHeight * 0.3 + hand.offsetHeight;
      hand.style.transform = `translate(0, ${y}px)`;
      hand.style.transition = `transform ${LOSING_TRANS_TIME}s ease-out`;
      break;

    case 'RAISING':
      y = -(container.offsetHeight - hand.offsetHeight / 2);
      x = hand.offsetWidth / 2;
      hand.style.transform = `translate(${x}px, ${y}px) rotate(${MAX_ANGLE}deg)`;
      hand.style.transition = `transform ${RAISING_TRANS_TIME}s ease-in`;
      break;

    case 'SMASHING':
      y = -(
        container.offsetHeight / 2 -
        container.offsetHeight * MARGIN_BOTTOM -
        hand.offsetHeight / 2
      );
      x = -(container.offsetWidth / 2 - hand.offsetWidth / 2);
      hand.style.transform = `translate(${x}px, ${y}px)`;
      hand.style.transition = `transform ${SMASHING_TRANS_TIME}s ease-out`;
      break;
  }
}

export class Animations {
  private unsmashed: HTMLElement;
  private smashed: HTMLElement;
  private container: HTMLElement;
  private flashElement: HTMLElement;
  private flashTimeoutId = 0;
  private yourHand: HandAnimation;
  private theirHand: HandAnimation;

  constructor() {
    this.unsmashed = $('#unsmashed')!;
    this.smashed = $('#smashed')!;
    this.container = $('#gameContainer')!;
    this.flashElement = $('#flash')!;

    this.yourHand = new HandAnimation(
      $('#yourHand')!,
      $('#yourSmasher')!,
      this.container,
      updateYourPosition,
    );

    this.theirHand = new HandAnimation(
      $('#theirHand')!,
      $('#theirSmasher')!,
      this.container,
      updateTheirPosition,
    );
  }

  updateYourProgress(progress: number): void {
    this.yourHand.updateProgress(progress);
  }

  updateTheirProgress(progress: number): void {
    this.theirHand.updateProgress(progress);
  }

  gameOver(youWon: boolean, complete?: () => void): void {
    if (youWon) {
      this.theirHand.runLoseAnimation();
      this.yourHand.runWinAnimation(() => {
        hide(this.unsmashed);
        show(this.smashed);
        complete?.();
      });
    } else {
      this.yourHand.runLoseAnimation();
      this.theirHand.runWinAnimation(() => {
        hide(this.unsmashed);
        show(this.smashed);
        complete?.();
      });
    }
  }

  reset(): void {
    this.yourHand.reset();
    this.theirHand.reset();
    hide(this.smashed);
    show(this.unsmashed);
  }

  flash(): void {
    clearTimeout(this.flashTimeoutId);
    show(this.flashElement);
    this.flashTimeoutId = window.setTimeout(() => {
      hide(this.flashElement);
    }, FLASH_DURATION);
  }

  attachResizeHandler(): void {
    this.yourHand.attachResizeHandler();
    this.theirHand.attachResizeHandler();
  }

  detachResizeHandler(): void {
    this.yourHand.detachResizeHandler();
    this.theirHand.detachResizeHandler();
  }
}
