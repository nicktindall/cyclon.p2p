'use strict';

var DEFAULT_NUM_NEIGHBOURS = 50;
var DEFAULT_SHUFFLE_SIZE = 10;
var DEFAULT_TICK_INTERVAL_MS = 30000;

var CyclonNode = require("./CyclonNode");
var NeighbourSet = require("./NeighbourSet");
var AsyncExecService = require("./AsyncExecService");
var ConsoleLogger = require("./ConsoleLogger");
var Utils = require("./Utils");
var InMemoryStorage = require("./InMemoryStorage");
var LocalComms = require("./LocalComms");
var LocalBootstrap = require("./LocalBootstrap");
var UnreachableError = require("./UnreachableError");

/**
 * A builder for CyclonNode instances
 */
function CyclonNodeBuilder(id, comms, bootstrap) {
	
	var numNeighbours = DEFAULT_NUM_NEIGHBOURS,
		shuffleSize = DEFAULT_SHUFFLE_SIZE,
		tickIntervalMs = DEFAULT_TICK_INTERVAL_MS,
		metadataProviders = {},
		asyncExecService = new AsyncExecService(),
		logger = new ConsoleLogger(),
		storage = new InMemoryStorage();

	this.withLogger = function(newLogger) {
		logger = newLogger;
		return this;
	};

	this.withNumNeighbours = function(newNumNeighbours) {
		numNeighbours = newNumNeighbours;
		return this;
	};

	this.withShuffleSize = function(newShuffleSize) {
		shuffleSize = newShuffleSize;
		return this;
	};

	this.withStorage = function(newStorage) {
		storage = newStorage;
		return this;
	};

	this.withMetadataProviders = function(newMetadataProviders) {
		metadataProviders = newMetadataProviders; 
		return this;
	};

	this.withAsyncExecService = function(newAsyncExecService) {
		asyncExecService = newAsyncExecService;
		return this;
	};

	this.withTickIntervalMs = function(newTickIntervalMs) {
		tickIntervalMs = newTickIntervalMs;
		return this;
	};

	this.build = function() {
		var neighbours = new NeighbourSet(logger);
		return new CyclonNode(id, neighbours, numNeighbours, shuffleSize, comms, bootstrap, 
			tickIntervalMs, metadataProviders, asyncExecService, logger, storage);
	};
};

module.exports.builder = function(id, comms, bootstrap) {
	return new CyclonNodeBuilder(id, comms, bootstrap);
};

module.exports.AsyncExecService = AsyncExecService;
module.exports.ConsoleLogger = ConsoleLogger;
module.exports.CyclonNode = CyclonNode;
module.exports.Utils = Utils;
module.exports.InMemoryStorage = InMemoryStorage;
module.exports.LocalBootstrap = LocalBootstrap;
module.exports.LocalComms = LocalComms;
module.exports.UnreachableError = UnreachableError;
