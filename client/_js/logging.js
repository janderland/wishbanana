'use strict';

// List of modules whose logs are not displayed.
var moduleFilter = {};
var levelFilter = 10;
var levelNames = ['ERROR', 'WARNING', 'DEBUG', 'INFO'];
var moment = require('moment');

module.exports = function Logging (module, showLevel) {
    if (showLevel !== undefined) {
        showLevel = true;
    }

    return {
        log: function (msg, level) {
            if (level === undefined) {
                level = 3;
            }

            if (!(module in moduleFilter) && level <= levelFilter) {
                var msgStr = moment().format('MM/DD/YY HH:MM');
                if (showLevel) {
                    msgStr += ' ' + levelNames[level];
                }
                msgStr += ' ' + msg + '\n';
                console.log(msgStr);
            }
        },
        filter: function (filters) {
            if (filters.module !== undefined) {
                for (var m in filters.module) {
                    if (filters.module[m]) {
                        moduleFilter[m] = true;
                    }
                    else {
                        delete moduleFilter[m];
                    }
                }
            }

            if (filters.level !== undefined) {
                levelFilter = filters.level;
            }
        },
        ERROR: 0,
        WARNING: 1,
        DEBUG: 2,
        INFO: 3
    };
};
