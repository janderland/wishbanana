'use strict';

var logging = require('./logging')('wishbanana');
var log = logging.log;

var unipage = require('unipage');
var $ = require('jquery');

$(function onDocumentReady () {
	var mainunipage = unipage($('body > div.page'));
  var game = require('./game')

	// When all images are loaded, switch to the menu page.
	// TODO - Fix this.
	mainunipage.switch('menu');

	// MENU ----------------------------------------------------------
	$('button#menuToStory').click(function onMenuToStoryClick () {
		mainunipage.switch('story');
	});

	$('button#menuToGame').click(function onMenuToGameClick () {
		mainunipage.switch('game');
	});

	$('button#openHelp').click(function onOpenHelpClick (event) {
		event.stopPropagation();
		$('#helpModal, #menu > #tint').show();

		$(document).one('click', function onHelpModalClick () {
			$('#helpModal, #menu > #tint').hide();
		});
	});

	// STORY ---------------------------------------------------------
	$('button#storyToMenu').click(function onStoryToMenuClick () {
		mainunipage.switch('menu');
	});

	// GAME ----------------------------------------------------------
	var WIN_CLICKS = 1;

	var gameunipage = unipage($('div#game').find('div.state')),
	    countingunipage = unipage($('div#counting').find('div.count')),
	    g = null;
	var animations = require('./animations')();

	var updateYourClicks = function (yourClicks) {
		animations.updateYourProgress(yourClicks / WIN_CLICKS);
	};

	var updateTheirClicks = function (theirClicks) {
		animations.updateTheirProgress(theirClicks / WIN_CLICKS);
	};

	var playingMouseDown = function () {
		g.click();
		animations.flash();
		updateYourClicks(g.count);
	};

	var initNewGame = function (name) {
		g = new game(name);
		g.onConnected = function () {
			$('#matching > h2').html('matching...');
		};
		g.onWinCount = function (count) {
      console.log("got win count " + count);
			WIN_CLICKS = count;
			if (WIN_CLICKS < 1) {
				WIN_CLICKS = 1;
			}
		};
		g.onMatched = function (opponentName) {
			$('.theirName').html(opponentName);
			gameunipage.switch('counting');
		};
		g.onCountDown = function (value) {
			$('#count > h1').html(value);
		};
		g.onPlaying = function () {
			gameunipage.switch('playing', true);
		};
		g.onClickCount = function (yourClicks, theirClicks) {
			updateYourClicks(yourClicks);
			updateTheirClicks(theirClicks);
		};
		g.onGameOver = function (youWon) {
			animations.gameOver(youWon, function gameOverComplete () {
				if (youWon) {
					$('#youWin').show();
				}
				else {
					$('#youLose').show();
				}
				$('#gameOverBanner').fadeIn();
			});
			$(document).off('mousedown', playingMouseDown);
		};
	};

	mainunipage.beforeShow('game', function gameBeforeShow () {
		gameunipage.switch('naming');
	});
	mainunipage.child('game', gameunipage);

	gameunipage.afterShow('naming', function namingAfterShowCallback () {
		$('input#name').focus();
	});
	gameunipage.beforeShow('matching', function matchingBeforeShow () {
		$('#matching > h2').html('connecting...');
	});
	gameunipage.beforeShow('counting', function countingBeforeShow () {
		$('#count > h1').html('');
	});
	gameunipage.beforeShow('playing', function playingBeforeShow () {
		$(document).on('mousedown', playingMouseDown);

		$('#youWin').hide();
		$('#youLose').hide();
		$('#gameOverBanner').hide();

		animations.reset();
		animations.attachResizeHandler();
	});
	gameunipage.beforeHide('playing', function playingBeforeHide () {
		$(document).off('mousedown', playingMouseDown);
		animations.detachResizeHandler();

		if (g !== null) {
			g.quit();
			g = null;
		}
	});

	$('button#gameToMenu').click(function onGameToMenuClick (event) {
		mainunipage.switch('menu');
		event.stopPropagation();
	});
	$('input#name').keydown(function nameInputEnterKey (e) {
		if (e.keyCode == 13) {
			$('button#namingDone').click();
		}
	});
	$('button#namingDone').click(function startNewGame () {
		var name = $('input#name').val();
		$('.yourName').html(name);

		initNewGame(name);

		gameunipage.switch('matching');
	});
	$('#playAgain').click(function onPlayAgainClick () {
		gameunipage.switch('naming');
	});
});
