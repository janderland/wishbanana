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
  | { name: 'PLAYING'; progress: number }
  | { name: 'LOSING' }
  | { name: 'RAISING' }
  | { name: 'SMASHING' };

abstract class HandAnimation {
  // Current state of the animation for a hand.
  protected state: AnimationState = { name: 'PLAYING', progress: 0 };

  // ID of the timeout used during the game over animation.
  private timeoutId = 0;

  // This method is attached as an event handler
  // to detect window resizing. We need to retain
  // a reference to it so we can remove it when
  // the game ends.
  private resizeHandler: () => void;

  constructor(
    protected hand: HTMLElement,
    protected smasher: HTMLElement,
    protected container: HTMLElement,
  ) {
    this.resizeHandler = () =>
      this.updatePosition();
  }

  // Your hand and the opponent's hand have slightly different
  // animation logic, and those differences are defined by
  // subclasses using this method.
  protected abstract updatePosition(): void;

  // Provide the percentage (0.0 - 1.0) of clicks performed
  // to abdjust the height of the hand. The hand begins at
  // position 0.0 and ends with a win at position 1.0.
  updateProgress(p: number): void {
    if (this.state.name !== 'PLAYING') {
      return;
    }
    this.state = { name: 'PLAYING', progress: p };
    this.updatePosition();
  }

  // Run the win animation and call the provided callback
  // when it completes.
  runWinAnimation(complete?: () => void): void {
    clearTimeout(this.timeoutId);
    this.updateState({ name: 'RAISING' });

    this.timeoutId = window.setTimeout(() => {
      this.updateState({ name: 'SMASHING' });
      this.timeoutId = window.setTimeout(() => {
        hide(this.hand);
        show(this.smasher);
        complete?.();
      }, SMASHING_TRANS_TIME * 1000);
    }, RAISING_TRANS_TIME * 1000);
  }

  // Run the lose animation and call the provided callback
  // when it completes.
  runLoseAnimation(complete?: () => void): void {
    clearTimeout(this.timeoutId);
    this.updateState({ name: 'LOSING' });

    this.timeoutId = window.setTimeout(() => {
      hide(this.hand);
      complete?.();
    }, LOSING_TRANS_TIME * 1000);
  }

  reset(): void {
    this.updateState({ name: 'PLAYING', progress: 0 });
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
    this.updatePosition();
  }
}

class YourHand extends HandAnimation {
  protected updatePosition(): void {
    let x: number, y: number, a: number;

    switch (this.state.name) {
      case 'PLAYING': {
        const progress = this.state.progress;
        const totalX = this.container.offsetHeight - this.hand.offsetHeight;
        y = -totalX * progress;
        x = -(this.hand.offsetWidth / 4) * progress;
        a = -MAX_ANGLE * progress;
        this.hand.style.transform = `translate(${x}px, ${y}px) rotate(${a}deg)`;
        this.hand.style.transition = `transform ${PLAYING_TRANS_TIME}s ease-in`;
        break;
      }

      case 'LOSING':
        // Because the #gameContainer is 40vmax tall and centered, 30% of the
        // window height plus the fist's height should get the fist off the screen
        y = window.innerHeight * 0.3 + this.hand.offsetHeight;
        this.hand.style.transform = `translate(0, ${y}px)`;
        this.hand.style.transition = `transform ${LOSING_TRANS_TIME}s ease-out`;
        break;

      case 'RAISING':
        y = -(this.container.offsetHeight - this.hand.offsetHeight / 2);
        x = -this.hand.offsetWidth / 2;
        this.hand.style.transform = `translate(${x}px, ${y}px) rotate(${-MAX_ANGLE}deg)`;
        this.hand.style.transition = `transform ${RAISING_TRANS_TIME}s ease-in`;
        break;

      case 'SMASHING':
        y = -(this.container.offsetHeight / 2 - this.hand.offsetHeight / 2);
        x = this.container.offsetWidth / 2 - this.hand.offsetWidth / 2;
        this.hand.style.transform = `translate(${x}px, ${y}px)`;
        this.hand.style.transition = `transform ${SMASHING_TRANS_TIME}s ease-out`;
        break;
    }
  }
}

class TheirHand extends HandAnimation {
  protected updatePosition(): void {
    const MARGIN_BOTTOM = 0.25; // 25%
    let x: number, y: number, a: number;

    switch (this.state.name) {
      case 'PLAYING': {
        const progress = this.state.progress;
        const totalX = this.container.offsetHeight * (1 - MARGIN_BOTTOM) - this.hand.offsetHeight;
        y = -totalX * progress;
        x = (this.hand.offsetWidth / 4) * progress;
        a = MAX_ANGLE * progress;
        this.hand.style.transform = `translate(${x}px, ${y}px) rotate(${a}deg)`;
        this.hand.style.transition = `transform ${PLAYING_TRANS_TIME}s ease-in`;
        break;
      }

      case 'LOSING':
        // Because the #gameContainer is 40vmax tall and centered, 30% of the
        // window height plus the fist's height should get the fist off the screen
        y = window.innerHeight * 0.3 + this.hand.offsetHeight;
        this.hand.style.transform = `translate(0, ${y}px)`;
        this.hand.style.transition = `transform ${LOSING_TRANS_TIME}s ease-out`;
        break;

      case 'RAISING':
        y = -(this.container.offsetHeight - this.hand.offsetHeight / 2);
        x = this.hand.offsetWidth / 2;
        this.hand.style.transform = `translate(${x}px, ${y}px) rotate(${MAX_ANGLE}deg)`;
        this.hand.style.transition = `transform ${RAISING_TRANS_TIME}s ease-in`;
        break;

      case 'SMASHING':
        y = -(
          this.container.offsetHeight / 2 -
          this.container.offsetHeight * MARGIN_BOTTOM -
          this.hand.offsetHeight / 2
        );
        x = -(this.container.offsetWidth / 2 - this.hand.offsetWidth / 2);
        this.hand.style.transform = `translate(${x}px, ${y}px)`;
        this.hand.style.transition = `transform ${SMASHING_TRANS_TIME}s ease-out`;
        break;
    }
  }
}

export class Animations {
  private unsmashed: HTMLElement;
  private smashed: HTMLElement;
  private container: HTMLElement;
  private flashElement: HTMLElement;
  private flashTimeoutId = 0;
  private yourHand: YourHand;
  private theirHand: TheirHand;

  constructor() {
    this.unsmashed = $('#unsmashed')!;
    this.smashed = $('#smashed')!;
    this.container = $('#gameContainer')!;
    this.flashElement = $('#flash')!;

    this.yourHand = new YourHand(
      $('#yourHand')!,
      $('#yourSmasher')!,
      this.container,
    );

    this.theirHand = new TheirHand(
      $('#theirHand')!,
      $('#theirSmasher')!,
      this.container,
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
