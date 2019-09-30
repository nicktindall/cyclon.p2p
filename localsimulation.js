'use strict';

const cyclon = require("./lib");

const NUM_NODES = 50;
const REPORT_INTERVAL_MS = 1000;
let round = 0;

const localSimulation = new cyclon.LocalSimulation(NUM_NODES);

console.log("Starting Cyclon.p2p simulation of " + NUM_NODES + " nodes");
console.log("Ideal entropy is " + localSimulation.getIdealEntropy());

localSimulation.startSimulation();

/**
 * Start reporting
 */
setInterval(dumpNetworkStats, REPORT_INTERVAL_MS);

function dumpNetworkStats() {
    round++;
    const networkStats = localSimulation.getNetworkStatistics();

    console.log(round + ": entropy (min=" + networkStats.entropy.min + ", mean=" + networkStats.entropy.mean + ", max=" + networkStats.entropy.max + "), "
        + "in-degree (mean=" + networkStats.inDegree.mean + ", std.dev=" + networkStats.inDegree.standardDeviation + "), "
        + "orphans=" + networkStats.orphanCount);
}
