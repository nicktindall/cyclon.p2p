'use strict';

/**
 * Extract a random sample of a list of items (uses reservoir sampling, so it's fast)
 *
 * @param fromSet The list to randomly choose items from
 * @param setSize The maximum number of items to sample
 * @returns {Array}
 */
exports.randomSample = function (fromSet, setSize) {

    var resultSet = [];

    for (var i = 0; i < fromSet.length; i++) {
        if (resultSet.length < setSize) {
            resultSet.push(fromSet[i]);
        }
        else {
            var insertAt = Math.floor(Math.random() * i);
            if (insertAt < resultSet.length) {
                resultSet[insertAt] = fromSet[i];
            }
        }
    }

    return resultSet;
};

/**
 * Convenience for checking the number of arguments to a function
 *
 * @param argumentsArray
 * @param expectedCount
 */
exports.checkArguments = function (argumentsArray, expectedCount) {

    if (argumentsArray.length !== expectedCount) {
        throw new Error("Invalid number of arguments provided for function! (expected " + expectedCount + ", got " + argumentsArray.length + ")");
    }
};