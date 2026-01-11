import { $, $$, fadeIn, hide, offMouseDown, onClick, onEnter, onMouseDown, onReady, setHtml, show } from './dom.js';
import { PageManager } from './state.js';
import { Animations } from './animations.js';
import { Game } from './game.js';

onReady(() => {
  const mainPages = new PageManager($$('body > div.page'));

  // When all images are loaded, switch to the menu page
  mainPages.switch('menu');

  // MENU ----------------------------------------------------------
  onClick($('#menuToStory'), () => {
    mainPages.switch('story');
  });

  onClick($('#menuToGame'), () => {
    mainPages.switch('game');
  });

  onClick($('#openHelp'), (event) => {
    event.stopPropagation();
    show($('#helpModal'));
    show($('#menu #tint'));

    onClick(
      $('body'),
      () => {
        hide($('#helpModal'));
        hide($('#menu #tint'));
      },
      { once: true },
    );
  });

  // STORY ---------------------------------------------------------
  onClick($('#storyToMenu'), () => {
    mainPages.switch('menu');
  });

  // GAME ----------------------------------------------------------
  let WIN_CLICKS = 1;

  const gamePages = new PageManager($$('div#game div.state'));
  const animations = new Animations();
  let g: Game | null = null;

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
    g = new Game(name);

    g.onConnected = () => {
      setHtml($('#matching > h2'), 'matching...');
    };

    g.onWinCount = (count) => {
      console.log('win count ' + count);
      WIN_CLICKS = count;
      if (WIN_CLICKS < 1) {
        WIN_CLICKS = 1;
      }
    };

    g.onMatched = (opponentName) => {
      setHtml($('.theirName'), opponentName);
      gamePages.switch('counting');
    };

    g.onCountDown = (value) => {
      setHtml($('#count > h1'), value.toString());
    };

    g.onPlaying = () => {
      gamePages.switch('playing');
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
      offMouseDown(playingMouseDown);
    };
  };

  mainPages.beforeShow('game', () => {
    gamePages.switch('naming');
  });
  mainPages.child('game', gamePages);

  gamePages.afterShow('naming', () => {
    $('input#name')?.focus();
  });

  gamePages.beforeShow('matching', () => {
    setHtml($('#matching > h2'), 'connecting...');
  });

  gamePages.beforeShow('counting', () => {
    setHtml($('#count > h1'), '');
  });

  gamePages.beforeShow('playing', () => {
    onMouseDown(playingMouseDown);

    hide($('#youWin'));
    hide($('#youLose'));
    hide($('#gameOverBanner'));

    animations.reset();
    animations.attachResizeHandler();
  });

  gamePages.beforeHide('playing', () => {
    offMouseDown(playingMouseDown);
    animations.detachResizeHandler();

    if (g !== null) {
      g.quit();
      g = null;
    }
  });

  onClick($('button#gameToMenu'), (event) => {
    mainPages.switch('menu');
    event.stopPropagation();
  });

  onEnter($('input#name'), () => {
    $('button#namingDone')?.click();
  });

  onClick($('button#namingDone'), () => {
    const nameInput = $('input#name') as HTMLInputElement;
    const name = nameInput.value;
    setHtml($('.yourName'), name);

    initNewGame(name);

    gamePages.switch('matching');
  });

  onClick($('#playAgain'), () => {
    gamePages.switch('naming');
  });
});
