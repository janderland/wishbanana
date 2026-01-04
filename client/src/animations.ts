import { $, hide, show } from './dom';

// The angle reached by the hand when the winning number of clicks is reached
const MAX_ANGLE = 20;
const FLASH_DURATION = 100;

// Time each part of the animation takes
const PLAYING_TRANS_TIME = 0.2;
const LOSING_TRANS_TIME = 1;
const RAISING_TRANS_TIME = 1.3;
const SMASHING_TRANS_TIME = 0.2;

enum AnimationState {
  PLAYING = 0,
  LOSING = 1,
  RAISING = 2,
  SMASHING = 3,
}

export interface Animations {
  updateYourProgress(progress: number): void;
  updateTheirProgress(progress: number): void;
  gameOver(youWon: boolean, complete?: () => void): void;
  reset(): void;
  flash(): void;
  attachResizeHandler(): void;
  detachResizeHandler(): void;
}

type UpdatePositionFn = (
  hand: HTMLElement,
  container: HTMLElement,
  state: AnimationState,
  progress: number,
) => void;

class HandAnimations {
  private state = AnimationState.PLAYING;
  private progress = 0;
  private timeoutId = 0;
  private resizeHandler: () => void;

  constructor(
    private hand: HTMLElement,
    private smasher: HTMLElement,
    private container: HTMLElement,
    private updatePosition: UpdatePositionFn,
  ) {
    this.resizeHandler = () =>
      this.updatePosition(this.hand, this.container, this.state, this.progress);
  }

  updateProgress(p: number): void {
    this.progress = p;
    this.updatePosition(this.hand, this.container, this.state, this.progress);
  }

  runWinAnimation(complete?: () => void): void {
    clearTimeout(this.timeoutId);
    this.updateState(AnimationState.RAISING);

    this.timeoutId = window.setTimeout(() => {
      this.updateState(AnimationState.SMASHING);
      this.timeoutId = window.setTimeout(() => {
        hide(this.hand);
        show(this.smasher);
        complete?.();
      }, SMASHING_TRANS_TIME * 1000);
    }, RAISING_TRANS_TIME * 1000);
  }

  runLoseAnimation(complete?: () => void): void {
    clearTimeout(this.timeoutId);
    this.updateState(AnimationState.LOSING);

    this.timeoutId = window.setTimeout(() => {
      hide(this.hand);
      complete?.();
    }, LOSING_TRANS_TIME * 1000);
  }

  reset(): void {
    this.progress = 0;
    this.updateState(AnimationState.PLAYING);
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
    this.updatePosition(this.hand, this.container, this.state, this.progress);
  }
}

function updateYourPosition(
  hand: HTMLElement,
  container: HTMLElement,
  state: AnimationState,
  progress: number,
): void {
  let x: number, y: number, a: number;

  switch (state) {
    case AnimationState.PLAYING: {
      const totalX = container.offsetHeight - hand.offsetHeight;
      y = -totalX * progress;
      x = -(hand.offsetWidth / 4) * progress;
      a = -MAX_ANGLE * progress;
      hand.style.transform = `translate(${x}px, ${y}px) rotate(${a}deg)`;
      hand.style.transition = `transform ${PLAYING_TRANS_TIME}s ease-in`;
      break;
    }

    case AnimationState.LOSING:
      // Because the #gameContainer is 40vmax tall and centered, 30% of the
      // window height plus the fist's height should get the fist off the screen
      y = window.innerHeight * 0.3 + hand.offsetHeight;
      hand.style.transform = `translate(0, ${y}px)`;
      hand.style.transition = `transform ${LOSING_TRANS_TIME}s ease-out`;
      break;

    case AnimationState.RAISING:
      y = -(container.offsetHeight - hand.offsetHeight / 2);
      x = -hand.offsetWidth / 2;
      hand.style.transform = `translate(${x}px, ${y}px) rotate(${-MAX_ANGLE}deg)`;
      hand.style.transition = `transform ${RAISING_TRANS_TIME}s ease-in`;
      break;

    case AnimationState.SMASHING:
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
  progress: number,
): void {
  const MARGIN_BOTTOM = 0.25; // 25%
  let x: number, y: number, a: number;

  switch (state) {
    case AnimationState.PLAYING: {
      const totalX = container.offsetHeight * (1 - MARGIN_BOTTOM) - hand.offsetHeight;
      y = -totalX * progress;
      x = (hand.offsetWidth / 4) * progress;
      a = MAX_ANGLE * progress;
      hand.style.transform = `translate(${x}px, ${y}px) rotate(${a}deg)`;
      hand.style.transition = `transform ${PLAYING_TRANS_TIME}s ease-in`;
      break;
    }

    case AnimationState.LOSING:
      // Because the #gameContainer is 40vmax tall and centered, 30% of the
      // window height plus the fist's height should get the fist off the screen
      y = window.innerHeight * 0.3 + hand.offsetHeight;
      hand.style.transform = `translate(0, ${y}px)`;
      hand.style.transition = `transform ${LOSING_TRANS_TIME}s ease-out`;
      break;

    case AnimationState.RAISING:
      y = -(container.offsetHeight - hand.offsetHeight / 2);
      x = hand.offsetWidth / 2;
      hand.style.transform = `translate(${x}px, ${y}px) rotate(${MAX_ANGLE}deg)`;
      hand.style.transition = `transform ${RAISING_TRANS_TIME}s ease-in`;
      break;

    case AnimationState.SMASHING:
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

export function createAnimations(): Animations {
  const unsmashed = $('#unsmashed')!;
  const smashed = $('#smashed')!;
  const container = $('#gameContainer')!;
  const flash = $('#flash')!;

  let flashTimeoutId = 0;

  const yourHand = new HandAnimations(
    $('#yourHand')!,
    $('#yourSmasher')!,
    container,
    updateYourPosition,
  );

  const theirHand = new HandAnimations(
    $('#theirHand')!,
    $('#theirSmasher')!,
    container,
    updateTheirPosition,
  );

  return {
    updateYourProgress(progress: number): void {
      yourHand.updateProgress(progress);
    },

    updateTheirProgress(progress: number): void {
      theirHand.updateProgress(progress);
    },

    gameOver(youWon: boolean, complete?: () => void): void {
      if (youWon) {
        theirHand.runLoseAnimation();
        yourHand.runWinAnimation(() => {
          hide(unsmashed);
          show(smashed);
          complete?.();
        });
      } else {
        yourHand.runLoseAnimation();
        theirHand.runWinAnimation(() => {
          hide(unsmashed);
          show(smashed);
          complete?.();
        });
      }
    },

    reset(): void {
      yourHand.reset();
      theirHand.reset();
      hide(smashed);
      show(unsmashed);
    },

    flash(): void {
      clearTimeout(flashTimeoutId);
      show(flash);
      flashTimeoutId = window.setTimeout(() => {
        hide(flash);
      }, FLASH_DURATION);
    },

    attachResizeHandler(): void {
      yourHand.attachResizeHandler();
      theirHand.attachResizeHandler();
    },

    detachResizeHandler(): void {
      yourHand.detachResizeHandler();
      theirHand.detachResizeHandler();
    },
  };
}
