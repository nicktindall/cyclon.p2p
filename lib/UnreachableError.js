"use strict";

function UnreachableError(message) {
    this.name = "UnreachableError";
    this.message = message;
}
UnreachableError.prototype = new Error();
UnreachableError.prototype.constructor = UnreachableError;

module.exports = UnreachableError;