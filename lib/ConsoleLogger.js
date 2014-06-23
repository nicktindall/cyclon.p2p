'use strict';

function ConsoleLogger() {

    this.error = function () {
        if (this.enabled) {
            console.error.apply(this, arguments);
        }
    };

    this.warn = function () {
        if (this.enabled) {
            console.warn.apply(this, arguments);
        }
    };

    this.info = function () {
        if (this.enabled) {
            console.info.apply(this, arguments);
        }
    };

    this.log = function () {
        if (this.enabled) {
            console.log.apply(this, arguments);
        }
    };

    this.debug = function () {
        if (this.enabled) {
            console.log.apply(this, arguments);
        }
    };
}

ConsoleLogger.prototype.enabled = true;

module.exports = ConsoleLogger;
