'use strict';

var Promise = require("bluebird");
var Utils = require("cyclon.p2p-common");

function LocalComms (localId, allNodes) {

    Utils.checkArguments(arguments, 2);

    this.initialize = function (node) {
        allNodes[node.getId()] = node;
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
                var responseSet = allNodes[destinationNodePointer.id].handleShuffleRequest({id: fromNode.getId()}, shuffleSet);
                allNodes[fromNode.getId()].handleShuffleResponse(destinationNodePointer, responseSet);
                resolve();
            }, 1);
        });
    };

    this.getLocalId = function () {
        return localId;
    };

    this.createNewPointer = function (metaData) {
        return {
            id: localId,
            metaData: metaData || {}
        }
    }
}

module.exports = LocalComms;