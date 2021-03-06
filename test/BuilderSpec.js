'use strict';

const Utils = require('cyclon.p2p-common');
const cyclon = require('../lib');
const ClientMocks = require('./ClientMocks');

describe("The cyclon-lib export", function() {

    var comms, bootstrap;

    beforeEach(function() {
        comms = ClientMocks.mockComms();
        bootstrap = ClientMocks.mockBootstrap();
    });

	it("exports a builder function", function() {
		expect(cyclon.builder).toEqual(jasmine.any(Function));
	});

	describe("the builder", function() {
		it("builds a CyclonNode", function() {
			expect(cyclon.builder(comms, bootstrap).build() instanceof cyclon.CyclonNodeImpl).toBeTruthy();
		});

		it("allows specification of the logger", function() {
			expect(cyclon.builder(comms, bootstrap).withLogger(Utils.consoleLogger()).build() instanceof cyclon.CyclonNodeImpl).toBeTruthy();
		});

		it("allows specification of the number of neighbours", function() {
			expect(cyclon.builder(comms, bootstrap).withNumNeighbours(10).build() instanceof cyclon.CyclonNodeImpl).toBeTruthy();
		});

        it("allows specification of the bootstrap size", function() {
            expect(cyclon.builder(comms, bootstrap).withBootstrapSize(10).build() instanceof cyclon.CyclonNodeImpl).toBeTruthy();
        });

        it("allows specification of the shuffle size", function() {
			expect(cyclon.builder(comms, bootstrap).withShuffleSize(10).build() instanceof cyclon.CyclonNodeImpl).toBeTruthy();
		});

		it("allows specification of the storage", function() {
			expect(cyclon.builder(comms, bootstrap).withStorage(Utils.newInMemoryStorage()).build() instanceof cyclon.CyclonNodeImpl).toBeTruthy();
		});

		it("allows specification of metadata providers", function() {
			expect(cyclon.builder(comms, bootstrap).withMetadataProviders([]).build() instanceof cyclon.CyclonNodeImpl).toBeTruthy();
		});

		it("allows specification of async exec service", function() {
			expect(cyclon.builder(comms, bootstrap).withAsyncExecService(Utils.asyncExecService()).build() instanceof cyclon.CyclonNodeImpl).toBeTruthy();
		});

		it("allows specification of tick interval ms", function() {
			expect(cyclon.builder(comms, bootstrap).withTickIntervalMs(1000).build() instanceof cyclon.CyclonNodeImpl).toBeTruthy();
		});
	});
});