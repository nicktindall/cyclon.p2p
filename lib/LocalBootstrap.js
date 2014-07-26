'use strict';

var Promise = require("bluebird");
var Utils = require("cyclon.p2p-common");

function LocalBootstrap(numNodes) {

    Utils.checkArguments(arguments, 1);

    /**
     * Peers are just given pointers to their neighbour to start with in the local simulation
     */
    this.getInitialPeerSet = function (cyclonNode) {
        return new Promise(function (resolve) {
            resolve([
                {id: String((cyclonNode.getId() + 1) % numNodes), age: 0}
            ]);
        });
    };
}

module.exports = LocalBootstrap;