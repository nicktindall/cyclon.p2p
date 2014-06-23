'use strict';

var EventEmitter = require("events").EventEmitter;
var Utils = require("./Utils");
var Promise = require("bluebird");
var UnreachableError = require("./UnreachableError");
var POINTER_SEQUENCE_STORAGE_KEY = "CyclonJsNodePointerSequenceNumberStoredValue";

function CyclonNode(id, neighbours, numNeighbours, shuffleSize, comms, bootstrapper, tickIntervalMs, metaDataProviders, asyncExecService, logger, storage) {

    Utils.checkArguments(arguments, 11);

    if (shuffleSize > numNeighbours) {
        throw new Error("Shuffle size cannot be larger than the neighbour cache size!");
    }

    var myself = this;
    var lastShuffleNodeId = null;
    var lastShuffleSet = [];
    var shuffleTimer = null;
    var started = false;
    var pointerCounter = 0;

    /**
     * Get the ID of this node
     *
     * @returns {*}
     */
    this.getId = function () {
        return id;
    };

    this.getNeighbourSet = function() {
        return neighbours;
    };

    /**
     * Get the initial peer set, then start shuffling at regular intervals
     */
    this.start = function () {
        if (!started) {
            comms.initialize(this);
            startShuffling();
        }
        else {
            logger.error("You can't start the node twice, are you insane!?");
        }
    };

    /**
     * Execute an "enhanced shuffle" with another node in the cache
     */
    this.executeShuffle = function () {

        //
        // If we haven't heard back from our last shuffle request, delete that neighbour
        //
        if (lastShuffleNodeId !== null) {
            deleteLastShuffleState();
        }

        //
        // Increase the age of all neighbour
        // entries by one
        //
        neighbours.incrementAges();

        //
        // Choose the oldest neighbour
        //
        var oldestNeighbourId = neighbours.findOldestId();

        //
        // If we have an oldest neighbour, engage them in a shuffle
        //
        if (typeof(oldestNeighbourId) !== "undefined") {
            var shuffleSet = neighbours.selectShuffleSet(shuffleSize);

            //
            // Replace destination node's entry with a pointer to myself
            //
            for (var i = 0; i < shuffleSet.length; i++) {
                if (shuffleSet[i].id === oldestNeighbourId) {
                    shuffleSet[i] = myself.createNewPointer();
                    break;
                }
            }

            lastShuffleNodeId = oldestNeighbourId;
            lastShuffleSet = shuffleSet;

            var outgoingPointer = neighbours.get(oldestNeighbourId);
            myself.emit("shuffleStarted", "outgoing", outgoingPointer);
            comms.sendShuffleRequest(myself, outgoingPointer, shuffleSet)
                .then(function () {
                    myself.emit("shuffleCompleted", "outgoing", outgoingPointer);
                })
                .catch(UnreachableError, function (e) {
                    console.warn(e.message);
                    myself.emit("shuffleError", "outgoing", outgoingPointer, "unreachable");
                })
                .catch(Promise.TimeoutError, function (e) {
                    console.warn(e.message);
                    myself.emit("shuffleTimeout", "outgoing", outgoingPointer);
                })
                .catch(Promise.CancellationError, function () {
                    myself.emit("shuffleTimeout", "outgoing", outgoingPointer);
                })
                .catch(function (error) {
                    logger.error("An unexpected error occurred sending a shuffle request to " + oldestNeighbourId, error);
                    myself.emit("shuffleError", "outgoing", outgoingPointer, "unknown");
                })
                .then(deleteLastShuffleState);
        }
        else {
            //
            // Our neighbour cache is empty, try and bootstrap
            //
            stopShuffling();
            bootstrapNeighbourCache();
        }
    };

    /**
     * Create a new pointer to this Cyclon node
     */
    this.createNewPointer = function () {
        var pointer = {id: id, age: 0, seq: getNextPointerSequenceNumber()};

        // Allow comms layer to add any comms specific stuff
        pointer.comms = comms.getPointerData();

        // Allow metadata providers to add metadata (if there are any)
        if (metaDataProviders) {
            pointer.metadata = {};
            for (var metaDataKey in metaDataProviders) {
                pointer.metadata[metaDataKey] = metaDataProviders[metaDataKey]();
            }
        }

        return pointer;
    };

    /**
     * Get the next pointer sequence number (restoring from session storage if it's stored)
     */
    function getNextPointerSequenceNumber() {
        if (pointerCounter === 0) {
            var storedSequenceNumber = storage.getItem(POINTER_SEQUENCE_STORAGE_KEY);
            pointerCounter = typeof(storedSequenceNumber) === "Number" ? storedSequenceNumber : 0;
        }
        var returnValue = pointerCounter++;
        storage.setItem(POINTER_SEQUENCE_STORAGE_KEY, pointerCounter);
        return returnValue;
    }

    /**
     * Handle an inbound shuffle request
     *
     * @param fromPointer
     * @param receivedSet
     * @returns {Object} the shuffle response
     */
    this.handleShuffleRequest = function (fromPointer, receivedSet) {

        //
        // Send a random set back
        //
        var responseSet = neighbours.randomSelection(shuffleSize);

        //
        // Discard entries pointing to me, and entries already in my cache
        //
        var filteredSet = receivedSet.filter(notMe);

        //
        // Populate cache with received set, first filling empty slots then replacing those sent in reply
        //
        incorporateSet(filteredSet, responseSet);

        //
        // Return the response set
        //
        return responseSet;
    };

    /**
     * Handle an inbound shuffle response
     *
     * @param fromPointer
     * @param responseSet
     */
    this.handleShuffleResponse = function (fromPointer, responseSet) {
        if (fromPointer.id === lastShuffleNodeId) {
            var filteredSet = responseSet.filter(notMe);
            incorporateSet(filteredSet, lastShuffleSet);
            deleteLastShuffleState();
        }
    };

    /**
     * Bootstrap the neighbour cache and begin shuffling
     */
    function bootstrapNeighbourCache() {
        logger.info("Neighbour cache empty, attempting to bootstrap");
        myself.emit("attemptingBootstrap");
        bootstrapper.getInitialPeerSet(myself, numNeighbours).then(
            function (initialPeerSet) {
                initialPeerSet.forEach(function (peer) {
                    neighbours.insert(peer);
                });

                startShuffling();
            })
            .catch(function (error) {
                logger.error("Error bootstrapping peers", error);
            });
    }

    /**
     * Start shuffling every 'tickIntervalMs' milliseconds
     */
    function startShuffling() {
        shuffleTimer = asyncExecService.setInterval(myself.executeShuffle, tickIntervalMs);
    }

    /**
     * Halt periodic shuffling
     */
    function stopShuffling() {
        asyncExecService.clearInterval(shuffleTimer);
    }

    /**
     * Incorporate a set of neighbours into the neighbour set
     *
     * @param neighboursToIncorporate The set of neighbours to incorporate
     * @param neighboursToReplace The set of neighbours to replace if we run out of space
     */
    function incorporateSet(neighboursToIncorporate, neighboursToReplace) {
        neighboursToIncorporate.forEach(function (item) {
            if (neighbours.contains(item.id)) {
                neighbours.mergeNodePointerIfNewer(item);
            }
            else {
                if (neighbours.size() >= numNeighbours) {
                    var toRemove = neighboursToReplace.pop();
                    neighbours.remove(toRemove.id);
                }
                neighbours.insert(item);
            }
        });
    }

    /**
     * The specified pointer doesn't point to me
     *
     * @param item
     * @returns {boolean}
     */
    function notMe(item) {
        return item.id !== id;
    }

    /**
     * Delete the last shuffle state, and remove the last node shuffled with
     * from the cache
     */
    function deleteLastShuffleState() {
        neighbours.remove(lastShuffleNodeId);
        lastShuffleNodeId = null;
        lastShuffleSet = [];
    }
}

CyclonNode.prototype = Object.create(EventEmitter.prototype);

module.exports = CyclonNode;