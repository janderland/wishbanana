'use strict';

var ids = {
	Matched:    0,
	CountDown:  1,
	Click:      2,
	GameOver:   3,
	Name:       4,
	NamePlease: 5,
	ClickCount: 6,
	WinCount:   7
};

var Message = function (type) {
	this.id = ids[type];
};

var WinCount = function (count) {
	Message.call(this, 'WinCount');
	this.count = count;
};

var NamePlease = function () {
	Message.call(this, 'NamePlease');
};

var Name = function (name) {
	Message.call(this, 'Name');
	this.name = name;
};

var Matched = function (opponentName) {
	Message.call(this, 'Matched');
	this.opponentName = opponentName;
};

var CountDown = function (value) {
	Message.call(this, 'CountDown');
	this.value = value;
};

var Click = function () {
	Message.call(this, 'Click');
};

var ClickCount = function (yourCount, theirCount) {
	Message.call(this, 'ClickCount');
	this.yourCount = yourCount;
	this.theirCount = theirCount;
};

var GameOver = function (won) {
	Message.call(this, 'GameOver');
	this.won = won;
};

module.exports = {
	Matched:	Matched,
	CountDown:	CountDown,
	Click:	    Click,
	GameOver:	GameOver,
	Name:		Name,
	NamePlease:	NamePlease,
	ClickCount: ClickCount,
	WinCount:   WinCount,
	ids:	    ids
};
