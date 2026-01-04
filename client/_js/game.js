'use strict';

var url = 'ws://wishbanana.deno.dev/',
	stateNames = ['Connecting', 'Matching', 'Counting', 'Playing', 'Ending'];

var logging = require('./logging')('Server');
var log = logging.log;
var client2Server = require('./client2Server');

module.exports = function Game (name) {
	var thisGame = this,
	    playing = true,
	    state = 0,

	    server = new client2Server(url, logging);

	var changeState = function (newState) {
		if (newState - state === 1) {
			state = newState;
			log('Game state changed: ' + state);
			return true;
		}

		log ('Invalid state change requested: ' + state + ' to ' + newState, logging.WARNING);
		return false;
	};

	server.onClose = function () {
		playing = false;
	};

  server.onError = function(data) {
    log("ERR: " + data, logging.ERROR);
  }

	server.onConnected = function () {
		thisGame.onConnected();
	};

	server.onWinCount = function (count) {
		thisGame.onWinCount(count);
	};

	server.onNamePlease = function () {
		if (changeState(1)) {
			server.name(name);
		}
	};

	server.onMatched = function (opponentName) {
		if (changeState(2)) {
			thisGame.onMatched(opponentName);
		}
	};

	server.onCountDown = function (value) {
		if (state !== 2) {
			log('Received countdown message during state ' + state, logging.WARNING);
		}

		if (value > 0) {
			thisGame.onCountDown(value);
		}
		else if (changeState(3)) {
			thisGame.onPlaying();
		}
	};

	server.onClickCount = function (yourClicks, theirClicks) {
		thisGame.count = yourClicks;
		thisGame.onClickCount(yourClicks, theirClicks);
	};

	server.onGameOver = function (youWon) {
		if (changeState(4)) {
			thisGame.onGameOver(youWon);
			thisGame.quit();
		}
	};

	this.click = function () {
		if (state === 3) {
			this.count++;
			server.click();
		}
	};

	this.quit = function () {
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
	};

	this.onConnected = undefined;
	this.onWinCount = undefined;
	this.onMatched = undefined;
	this.onCountDown = undefined;
	this.onPlaying = undefined;
	this.onClickCount = undefined;
	this.onGameOver = undefined;
	this.count = 0;
};
