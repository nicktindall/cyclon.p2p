'use strict';

var Promise = require("bluebird");
var Utils = require("cyclon.p2p-common");

function LocalComms (localId, allNodes) {

    Utils.checkArguments(arguments, 2);

    this.initialize = function (node, metadataProviders) {
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
        var responseSet = allNodes[destinationNodePointer.id].handleShuffleRequest(null, shuffleSet);
        allNodes[fromNode.getId()].handleShuffleResponse(destinationNodePointer, responseSet);
        return Promise.resolve();
    };

    this.getLocalId = function () {
        return localId;
    };

    this.createNewPointer = function (metaData) {
        return {
            id: localId,
            metaData: metaData || {},
            age: 0
        }
    }
}

module.exports = LocalComms;
