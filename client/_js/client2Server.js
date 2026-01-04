	'use strict';

	module.exports = function Server (url, logging) {
    var log = logging.log
		if (!window.WebSocket) {
			log('WebSockets are not supported.', logging.ERROR);
			throw new Error('WebSockets are not supported.');
		}

		// 'thisServer' preserves the value of 'this' in the websocket's event handlers.
		var thisServer = this;
		var conn = new WebSocket(url, ['wishbanana']);
		var messages = require('./messages');

		var callIfDefined = function (functionName) {
			if (thisServer[functionName] !== undefined) {
        log("calling " + functionName, logging.INFO)
				thisServer[functionName].apply(this, Array.prototype.slice.call(arguments, 1));
        return;
			}
      log("not calling " + functionName, logging.INFO)
		};

		var sendMessage = function (message) {
      var data = JSON.stringify(message)
      log(data, logging.INFO);
			conn.send(data);
		};

		conn.onopen = function () {
			callIfDefined('onConnected');
		};

		conn.onmessage = function (event) {
      log(event.data, logging.INFO);
			var message;

			try {
				message = JSON.parse(event.data);
			}
			catch (err) {
				callIfDefined('onError', event.data);
				return;
			}

			var id = message.id;
			if (id === messages.ids.WinCount) {
				callIfDefined('onWinCount', message.count);
			}
			else if (id === messages.ids.NamePlease) {
				callIfDefined('onNamePlease');
			}
			else if (id === messages.ids.Matched) {
				callIfDefined('onMatched', message.opponentName);
			}
			else if (id === messages.ids.CountDown) {
				callIfDefined('onCountDown', message.value);
			}
			else if (id === messages.ids.ClickCount) {
				callIfDefined('onClickCount', message.yourCount, message.theirCount);
			}
			else if (id === messages.ids.GameOver) {
				callIfDefined('onGameOver', message.won);
			}
			else {
				callIfDefined('onError', event.data);
			}
		};

		conn.onclose = function onClose (event) {
			callIfDefined('onClose', event.code, event.reason);
		};

		this.name = function (name) {
			sendMessage(new messages.Name(name));
		};

		this.click = function () {
			sendMessage(new messages.Click());
		};

		this.close = function () {
			conn.close();
		};

		this.onConnected = undefined;
		this.onWinCount = undefined;
		this.onMessage = undefined;
		this.onNamePlease = undefined;
		this.onMatched = undefined;
		this.onOpponentName = undefined;
		this.onCountDown = undefined;
		this.onClickCount = undefined;
		this.onGameOver = undefined;
		this.onError = undefined;
		this.onClose = undefined;
	};
