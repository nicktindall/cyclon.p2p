'use strict';

var Promise = require("bluebird");

function LocalComms() {

    var nodes = {};

    this.initialize = function (node) {
        nodes[node.getId()] = node;
    };

    /**
     * Get all IDs registered in the network
     *
     * @returns {Array}
     */
    this.getAllIds = function () {
        return Object.keys(nodes);
    };

    /**
     * We don't provide any data for the pointer
     */
    this.getPointerData = function() {
        return null;
    };

    /**
     * Send a shuffle request to another node
     *
     * @param fromNode
     * @param destinationNodePointer
     * @param shuffleSet
     */
    this.sendShuffleRequest = function (fromNode, destinationNodePointer, shuffleSet) {
        return new Promise(function(resolve) {
            setTimeout(function () {
                var responseSet = nodes[destinationNodePointer.id].handleShuffleRequest({id: fromNode.getId()}, shuffleSet);
                nodes[fromNode.getId()].handleShuffleResponse(destinationNodePointer, responseSet);
                resolve();
            }, 1);
        });
    };
}

module.exports = LocalComms;