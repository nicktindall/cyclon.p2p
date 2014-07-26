'use strict';
var cyclon = require("./lib");
var gauss = require("gauss");

var NUM_NODES = 1000;
var REPORT_INTERVAL_MS = 1000;

var allNodes = {};
var localBootstrap = new cyclon.LocalBootstrap(NUM_NODES);
var logger = new cyclon.ConsoleLogger();
var nodes = [];
var neighbourSets = [];
var round = 0;

for (var nodeId = 0; nodeId < NUM_NODES; nodeId++) {
    var cyclonNode = cyclon.builder(new cyclon.LocalComms(nodeId, allNodes), localBootstrap)
    		.withTickIntervalMs(1000)
    		.withLogger(logger)
    		.build();

    nodes.push(cyclonNode);
    neighbourSets.push(cyclonNode.getNeighbourSet());
}

/**
 * Start all the nodes
 */
nodes.forEach(function(node) {
    node.start();
});

function tick() {
    round++;
    printNetworkStatistics();
}

/**
 * Calculate the average inbound pointer count
 *
 * @returns {number}
 */
function printNetworkStatistics() {
    var counts = {};

    neighbourSets.forEach(function (neighbourSet) {
        for(var id in allNodes) {
            var increment = neighbourSet.contains(id) ? 1 : 0;
            counts[id] = counts[id] === undefined ? increment : counts[id] + increment;
        }
    });

    var countsArray = [];
    var orphanCount = 0;
    for(var key in counts) {
        var countForKey = counts[key];
        countsArray.push(countForKey);
        if(countForKey === 0) {
            orphanCount++;
        }
    }

    var statsVector = new gauss.Vector(countsArray);

    logger.debug(round + ": Mean inbound = " + statsVector.mean() + ", st.dev = " + statsVector.stdev() + ", orphans: "+orphanCount);
}

setInterval(tick, REPORT_INTERVAL_MS);