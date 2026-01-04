'use strict';

// The angle reached by the hand when the winning number
// of clicks is reached.
var MAX_ANGLE = 20;

var FLASH_DURATION = 100;

// Time each part of the animation takes.
var PLAYING_TRANS_TIME = 0.2;
var LOSING_TRANS_TIME = 1;
var RAISING_TRANS_TIME = 1.3;
var SMASHING_TRANS_TIME = 0.2;

var STATE = {
	PLAYING: 0,
	LOSING: 1,
	RAISING: 2,
	SMASHING: 3
};


module.exports = function() {
  var $ = require('jquery');

  var $unsmashed = $('#unsmashed');
  var $smashed = $('#smashed');
  var $container = $('#gameContainer');
  var $flash = $('#flash');
  var $window = $(window);

  var flashTimeoutId = 0;

  // Given the player's hand/smasher jQuery objects and the updatePosition function,
  // this object controls the player's hand's animations.
  function HandAnimations ($hand, $smasher, updatePosition) {
    var state = STATE.PLAYING;
    var progress = 0;
    var timeoutId = 0;

    function updateState (s) {
      state = s;
      updatePosition($hand, $container, state, progress);
    }

    this.updateProgress = function (p) {
      progress = p;
      updatePosition($hand, $container, state, progress);
    };

    this.runWinAnimation = function (complete) {
      // Stop the currently running animation.
      clearTimeout(timeoutId);

      updateState(STATE.RAISING);
      timeoutId = setTimeout(function raisingComplete () {
        updateState(STATE.SMASHING);
        timeoutId = setTimeout(function smashingComplete () {
          $hand.hide();
          $smasher.show();
          if (complete !== undefined) {
            complete();
          }
        }, SMASHING_TRANS_TIME * 1000);
      }, RAISING_TRANS_TIME * 1000);
    };

    this.runLoseAnimation = function (complete) {
      // Stop the currently running animation.
      clearTimeout(timeoutId);

      updateState(STATE.LOSING);
      timeoutId = setTimeout(function losingComplete () {
        $hand.hide();
        if (complete !== undefined) {
          complete();
        }
      }, LOSING_TRANS_TIME * 1000);
    };

    this.reset = function () {
      progress = 0;
      updateState(STATE.PLAYING);
      $hand.show();
      $smasher.hide();
    };

    this.attachResizeHandler = function () {
      $window.on('resize', updatePosition);
    };

    this.detachResizeHandler = function () {
      $window.off('resize', updatePosition);
    };
  }

  var yourHand = new HandAnimations(
    $('#yourHand'),
    $('#yourSmasher'),
    function updateYourPosition ($hand, $container, state, progress) {
      var totalX;
      var x, y, a;

      switch(state) {
        case STATE.PLAYING:
          totalX = $container.height() - $hand.height();
          y = -totalX * progress;
          x = -($hand.width() / 4) * progress;
          a = -MAX_ANGLE * progress;
          $hand.css({
            transform: 'translate(' + x + 'px, ' + y + 'px) rotate(' + a + 'deg)' ,
            transition: 'transform ' + PLAYING_TRANS_TIME + 's ease-in'
          });
          break;

        case STATE.LOSING:
          // Because the #gameContainer is 40vmax tall and centered, 30% of the
          // window height plus the fist's height should get the fist off the
          // screen.
          y =  ($window.height() * 0.30) + $hand.height();
          $hand.css({
            transform: 'translate(0, ' + y + 'px)',
            transition: 'transform ' + LOSING_TRANS_TIME + 's ease-out'
          });
          break;

        case STATE.RAISING:
          y = - ($container.height() - ($hand.height() / 2));
          x = - $hand.width() / 2;
          $hand.css({
            transform: 'translate(' + x + 'px, ' + y + 'px) rotate(' + -MAX_ANGLE + 'deg)',
            transition: 'transform ' + RAISING_TRANS_TIME + 's ease-in'
          });
          break;

        case STATE.SMASHING:
          y = - (($container.height() / 2) - ($hand.height() / 2));
          x = ($container.width() / 2) - ($hand.width() / 2);
          $hand.css({
            transform: 'translate(' + x + 'px, ' + y + 'px)',
            transition: 'transform ' + SMASHING_TRANS_TIME + 's ease-out'
          });
          break;
      }
    }
  );

  var theirHand = new HandAnimations(
    $('#theirHand'),
    $('#theirSmasher'),
    function updateTheirPosition ($hand, $container, state, progress) {
      var MARGIN_BOTTOM = 0.25; //25%
      var totalX;
      var x, y, a;

      switch (state) {
        case STATE.PLAYING:
          totalX = ($container.height() * (1-MARGIN_BOTTOM)) - $hand.height();
          y = -totalX * progress;
          x = ($hand.width() / 4) * progress;
          a = MAX_ANGLE * progress;
          $hand.css({
            transform: 'translate(' + x + 'px, ' + y + 'px) rotate(' + a + 'deg)',
            transition: 'transform ' + PLAYING_TRANS_TIME + 's ease-in'
          });
          break;

        case STATE.LOSING:
          // Because the #gameContainer is 40vmax tall and centered, 30% of the
          // window height plus the fist's height should get the fist off the
          // screen.
          y =  ($window.height() * 0.30) + $hand.height();
          $hand.css({
            transform: 'translate(0, ' + y + 'px)',
            transition: 'transform ' + LOSING_TRANS_TIME + 's ease-out'
          });
          break;

        case STATE.RAISING:
          y = - ($container.height() - ($hand.height() / 2));
          x = $hand.width() / 2;
          $hand.css({
            transform: 'translate(' + x + 'px, ' + y + 'px) rotate(' + MAX_ANGLE + 'deg)',
            transition: 'transform ' + RAISING_TRANS_TIME + 's ease-in'
          });
          break;

        case STATE.SMASHING:
          y = - (($container.height() / 2) - ($container.height() * MARGIN_BOTTOM) - ($hand.height() / 2));
          x = - (($container.width() / 2) - ($hand.width() / 2));
          $hand.css({
            transform: 'translate(' + x + 'px, ' + y + 'px)',
            transition: 'transform ' + SMASHING_TRANS_TIME + 's ease-out'
          });
          break;
      }
    }
  );

  return {
    updateYourProgress: yourHand.updateProgress,
    updateTheirProgress: theirHand.updateProgress,
    gameOver: function (youWon, complete) {
      if (youWon) {
        theirHand.runLoseAnimation();
        yourHand.runWinAnimation(function youWonComplete () {
          $unsmashed.hide();
          $smashed.show();

          if (complete !== undefined) {
            complete();
          }
        });
      }
      else {
        yourHand.runLoseAnimation();
        theirHand.runWinAnimation(function theyWinComplete () {
          $unsmashed.hide();
          $smashed.show();

          if (complete !== undefined) {
            complete();
          }
        });
      }
    },
    reset: function () {
      yourHand.reset();
      theirHand.reset();
      $smashed.hide();
      $unsmashed.show();
    },
    flash: function () {
      clearTimeout(flashTimeoutId);
      $flash.show();
      flashTimeoutId = setTimeout(function flashTimeout () {
        $flash.hide();
      }, FLASH_DURATION);
    },
    attachResizeHandler: function () {
      yourHand.attachResizeHandler();
      theirHand.attachResizeHandler();
    },
    detachResizeHandler: function () {
      yourHand.detachResizeHandler();
      theirHand.detachResizeHandler();
    }
  };
}
