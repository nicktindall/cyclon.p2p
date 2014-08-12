'use strict';

var Promise = require("bluebird");
var CyclonNode = require("../lib/CyclonNode");
var ClientMocks = require("./ClientMocks");

describe("The Cyclon node", function () {

    var requestOne, requestTwo, requestThree,
        responseOne, responseTwo, responseThree,
        requestSet, responseSet,
        theNode,
        neighbourSet,
        comms,
        logger,
        storage,
        bootstrap,
        metadataProviders,
        asyncExecService,
        TICK_INTERVAL_MS = 3000,
        ID = 1234,
        OTHER_ID = 5678,
        NUM_NEIGHBOURS = 50,
        SHUFFLE_SIZE = 10,
        BOOTSTRAP_SIZE = 66,
        POINTER = {
            "id": ID,
            "seq": 55,
            "metadata": {}
        };

    beforeEach(function () {
        requestOne = neighbour('a', 1);
        requestTwo = neighbour('b', 2);
        requestThree = neighbour('c', 3);

        responseOne = neighbour('d', 1);
        responseTwo = neighbour('e', 2);
        responseThree = neighbour('f', 3);

        requestSet = [requestOne, requestTwo, requestThree];
        responseSet = [responseOne, responseTwo, responseThree];

        bootstrap = ClientMocks.mockBootstrap();
        neighbourSet = ClientMocks.mockNeighbourSet();
        comms = ClientMocks.mockComms();
        logger = ClientMocks.mockLoggingService();
        asyncExecService = ClientMocks.mockAsyncExecService();
        storage = ClientMocks.mockStorage();
        metadataProviders = {};
        bootstrap.getInitialPeerSet.andReturn(Promise.resolve([POINTER]));
        comms.createNewPointer.andReturn(POINTER);
        comms.getLocalId.andReturn(ID);
        comms.sendShuffleRequest.andReturn(Promise.resolve(null));
        theNode = new CyclonNode(neighbourSet, NUM_NEIGHBOURS, BOOTSTRAP_SIZE, SHUFFLE_SIZE, comms, bootstrap, TICK_INTERVAL_MS, metadataProviders, asyncExecService, logger, storage);
    });

    it("should return it's ID", function () {
        expect(theNode.getId()).toBe(ID);
    });

    describe("when the neighbour set is empty", function() {

        it("should stop shuffling and attempt to bootstrap", function() {

            theNode.executeShuffle();

            expect(asyncExecService.clearInterval).toHaveBeenCalled();
            expect(bootstrap.getInitialPeerSet).toHaveBeenCalledWith(theNode, BOOTSTRAP_SIZE);
        });
    });

    describe("when initiating a shuffle", function () {

        var oldestNeighbour = {id: OTHER_ID, age: 100};

        beforeEach(function () {
            neighbourSet.findOldestId.andReturn(OTHER_ID);
            neighbourSet.selectShuffleSet.andReturn([oldestNeighbour].concat(requestSet));
            neighbourSet.get.andReturn(oldestNeighbour);
        });

        it("should send the shuffle request to the oldest peer", function () {
            theNode.executeShuffle();

            expect(comms.sendShuffleRequest).toHaveBeenCalledWith(theNode, oldestNeighbour, [POINTER].concat(requestSet));
        });

        it("should increment the ages of all node pointers in the cache prior to selecting the shuffle set", function () {

            var incrementHasBeenCalled = false;

            neighbourSet.incrementAges.andCallFake(function () {
                incrementHasBeenCalled = true;
            });

            neighbourSet.selectShuffleSet.andCallFake(function () {
                expect(incrementHasBeenCalled).toBeTruthy();
                return [];
            });

            theNode.executeShuffle();
        });

        it("should remove the last neighbour we shuffled with if it has not responded", function () {
            runs(function() {
                comms.sendShuffleRequest.andReturn(new Promise(function() {}));
                theNode.executeShuffle();
            });

            waits(10);

            runs(function() {
                theNode.executeShuffle();
                expect(neighbourSet.remove).toHaveBeenCalledWith(OTHER_ID);
            });
        });

        it("should remove the last neighbour we shuffled with if sending the shuffle fails", function () {
            runs(function() {
                comms.sendShuffleRequest.andReturn(Promise.reject(new Error("Something bad happened!")));
                theNode.executeShuffle();
            });

            waits(10);

            runs(function() {
                expect(neighbourSet.remove).toHaveBeenCalledWith(OTHER_ID);
            });
        });
    });


    describe("when handling a shuffle request", function () {

        beforeEach(function () {
            neighbourSet.randomSelection.andReturn(responseSet);
        });

        it("should respond with a random selection of its own neighbours", function () {
            expect(theNode.handleShuffleRequest(OTHER_ID, requestSet)).toBe(responseSet);
        });

        it("should insert all new neighbours received into its set when there are enough empty slots", function () {
            neighbourSet.size.andReturn(20);

            theNode.handleShuffleRequest(OTHER_ID, requestSet);

            expect(neighbourSet.insert).toHaveBeenCalledWith(requestOne);
            expect(neighbourSet.insert).toHaveBeenCalledWith(requestTwo);
            expect(neighbourSet.insert).toHaveBeenCalledWith(requestThree);
            expect(neighbourSet.mergeNodePointerIfNewer).not.toHaveBeenCalled();
        });

        it("should not incorporate pointers to itself in its neighbour set", function () {
            var pointerToMe = {id: ID, age: 10};

            theNode.handleShuffleRequest(OTHER_ID, requestSet.concat(pointerToMe));

            expect(neighbourSet.insert).not.toHaveBeenCalledWith(pointerToMe);
        });

        it("should attempt to merge pointers already present in its neighbour set", function () {
            neighbourSet.contains.andReturn(true);

            theNode.handleShuffleRequest(OTHER_ID, requestSet);

            expect(neighbourSet.insert).not.toHaveBeenCalled();
            expect(neighbourSet.mergeNodePointerIfNewer).toHaveBeenCalled();
        });

        it("should remove neighbours sent in the response when the set is at capacity", function () {
            neighbourSet.size.andReturn(50);

            theNode.handleShuffleRequest(OTHER_ID, requestSet);

            expect(neighbourSet.remove).toHaveBeenCalledWith(responseOne.id);
            expect(neighbourSet.remove).toHaveBeenCalledWith(responseTwo.id);
            expect(neighbourSet.remove).toHaveBeenCalledWith(responseThree.id);
            expect(neighbourSet.insert).toHaveBeenCalledWith(requestOne);
            expect(neighbourSet.insert).toHaveBeenCalledWith(requestTwo);
            expect(neighbourSet.insert).toHaveBeenCalledWith(requestThree);
        });
    });


    describe("when handling a shuffle response", function () {

        var fromPointer = {id: OTHER_ID, age: 0};

        beforeEach(function () {
            neighbourSet.findOldestId.andReturn(OTHER_ID);
            neighbourSet.selectShuffleSet.andReturn(requestSet);
            theNode.executeShuffle();
        });

        it("should not incorporate pointers already in its neighbour set", function () {
            neighbourSet.contains.andReturn(true);

            theNode.handleShuffleResponse(fromPointer, responseSet);

            expect(neighbourSet.insert).not.toHaveBeenCalled();
        });

        it("should remove neighbours sent in the request when the set is at capacity", function () {
            neighbourSet.size.andReturn(50);

            theNode.handleShuffleResponse(fromPointer, responseSet);

            expect(neighbourSet.remove).toHaveBeenCalledWith(requestOne.id);
            expect(neighbourSet.remove).toHaveBeenCalledWith(requestTwo.id);
            expect(neighbourSet.remove).toHaveBeenCalledWith(requestThree.id);
            expect(neighbourSet.insert).toHaveBeenCalledWith(responseOne);
            expect(neighbourSet.insert).toHaveBeenCalledWith(responseTwo);
            expect(neighbourSet.insert).toHaveBeenCalledWith(responseThree);
        });

        it("should ignore responses to anything other than the most recent outstanding shuffle request", function () {
            theNode.handleShuffleResponse({id: 98765, age: 0}, responseSet);

            expect(neighbourSet.insert).not.toHaveBeenCalled();
        });

        it("should remove the responding neighbour from the cache", function () {
            theNode.handleShuffleResponse(fromPointer, responseSet);

            expect(neighbourSet.remove).toHaveBeenCalledWith(OTHER_ID);
        });
    });

    /**
     * Convenience for building neighbours
     */
    function neighbour(id, age) {
        return {id: id, age: age};
    }
});