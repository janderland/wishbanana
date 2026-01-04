import { createStateManager } from './state.js';
import { createGame, Game } from './game.js';
import { createAnimations } from './animations.js';
import { $, $$, fadeIn, hide, onClick, onReady, setHtml, show } from './dom.js';

onReady(() => {
  const mainState = createStateManager($$('body > div.page'));

  // When all images are loaded, switch to the menu page
  mainState.switch('menu');

  // MENU ----------------------------------------------------------
  onClick($('#menuToStory'), () => {
    mainState.switch('story');
  });

  onClick($('#menuToGame'), () => {
    mainState.switch('game');
  });

  onClick($('#openHelp'), (event) => {
    event.stopPropagation();
    show($('#helpModal'));
    show($('#menu #tint'));

    document.addEventListener(
      'click',
      () => {
        hide($('#helpModal'));
        hide($('#menu #tint'));
      },
      { once: true },
    );
  });

  // STORY ---------------------------------------------------------
  onClick($('#storyToMenu'), () => {
    mainState.switch('menu');
  });

  // GAME ----------------------------------------------------------
  let WIN_CLICKS = 1;

  const gameState = createStateManager($$('div#game div.state'));
  let g: Game | null = null;
  const animations = createAnimations();

  const updateYourClicks = (yourClicks: number) => {
    animations.updateYourProgress(yourClicks / WIN_CLICKS);
  };

  const updateTheirClicks = (theirClicks: number) => {
    animations.updateTheirProgress(theirClicks / WIN_CLICKS);
  };

  const playingMouseDown = () => {
    if (g) {
      g.click();
      animations.flash();
      updateYourClicks(g.count);
    }
  };

  const initNewGame = (name: string) => {
    g = createGame(name);

    g.onConnected = () => {
      setHtml($('#matching > h2'), 'matching...');
    };

    g.onWinCount = (count) => {
      console.log('got win count ' + count);
      WIN_CLICKS = count;
      if (WIN_CLICKS < 1) {
        WIN_CLICKS = 1;
      }
    };

    g.onMatched = (opponentName) => {
      setHtml($('.theirName'), opponentName);
      gameState.switch('counting');
    };

    g.onCountDown = (value) => {
      setHtml($('#count > h1'), value.toString());
    };

    g.onPlaying = () => {
      gameState.switch('playing', true);
    };

    g.onClickCount = (yourClicks, theirClicks) => {
      updateYourClicks(yourClicks);
      updateTheirClicks(theirClicks);
    };

    g.onGameOver = (youWon) => {
      animations.gameOver(youWon, () => {
        if (youWon) {
          show($('#youWin'));
        } else {
          show($('#youLose'));
        }
        fadeIn($('#gameOverBanner'));
      });
      document.removeEventListener('mousedown', playingMouseDown);
    };
  };

  mainState.beforeShow('game', () => {
    gameState.switch('naming');
  });
  mainState.child('game', gameState);

  gameState.afterShow('naming', () => {
    $('input#name')?.focus();
  });

  gameState.beforeShow('matching', () => {
    setHtml($('#matching > h2'), 'connecting...');
  });

  gameState.beforeShow('counting', () => {
    setHtml($('#count > h1'), '');
  });

  gameState.beforeShow('playing', () => {
    document.addEventListener('mousedown', playingMouseDown);

    hide($('#youWin'));
    hide($('#youLose'));
    hide($('#gameOverBanner'));

    animations.reset();
    animations.attachResizeHandler();
  });

  gameState.beforeHide('playing', () => {
    document.removeEventListener('mousedown', playingMouseDown);
    animations.detachResizeHandler();

    if (g !== null) {
      g.quit();
      g = null;
    }
  });

  onClick($('button#gameToMenu'), (event) => {
    mainState.switch('menu');
    event.stopPropagation();
  });

  $('input#name')?.addEventListener('keydown', (e) => {
    if ((e as KeyboardEvent).keyCode === 13) {
      $('button#namingDone')?.click();
    }
  });

  onClick($('button#namingDone'), () => {
    const nameInput = $('input#name') as HTMLInputElement;
    const name = nameInput.value;
    setHtml($('.yourName'), name);

    initNewGame(name);

    gameState.switch('matching');
  });

  onClick($('#playAgain'), () => {
    gameState.switch('naming');
  });
});
