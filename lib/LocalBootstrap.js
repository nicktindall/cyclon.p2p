'use strict';

var Promise = require("bluebird");

function LocalBootstrap(numNodes) {

    /**
     * Peers are just given pointers to their neighbour to start with in the local simulation
     */
    this.getInitialPeerSet = function (cyclonNode) {
        return new Promise(function (resolve) {
            resolve([
                {id: String((cyclonNode.getId() + 1) % numNodes), age: 1}
            ]);
        });
    };
}

module.exports = LocalBootstrap;