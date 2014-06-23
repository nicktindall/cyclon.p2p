'use strict';

var cyclon = require("../lib/index.js");

describe("The cyclon-lib export", function() {
	
	it("exports InMemoryStorage", function() {

		expect(cyclon.InMemoryStorage).toEqual(jasmine.any(Function));
		var storage = new cyclon.InMemoryStorage();
		storage.setItem("XXX", "YYY");
		expect(storage.getItem("XXX")).toEqual("YYY");
	});

	it("exports a builder function", function() {
		expect(cyclon.builder).toEqual(any(Function));
	});

	describe("the builder", function() {
		it("builds a CyclonNode", function() {
			expect(cyclon.builder().build() instanceof cyclon.CyclonNode).toBeTruthy();
		});

		it("allows specification of the logger", function() {
			expect(cyclon.builder().withLogger(new cyclon.ConsoleLogger()).build() instanceof cyclon.CyclonNode).toBeTruthy();
		});

		it("allows specification of the numbef of neigbours", function() {
			expect(cyclon.builder().withNumNeighbours(10).build() instanceof cyclon.CyclonNode).toBeTruthy();
		});

		it("allows specification of the shuffle size", function() {
			expect(cyclon.builder().withShuffleSize(10).build() instanceof cyclon.CyclonNode).toBeTruthy();
		});

		it("allows specification of the storage", function() {
			expect(cyclon.builder().withStorage(new cyclon.InMemoryStorage()).build() instanceof cyclon.CyclonNode).toBeTruthy();
		});

		it("allows specification of metadata providers", function() {
			expect(cyclon.builder().withMetadataProviders([]).build() instanceof cyclon.CyclonNode).toBeTruthy();
		});

		it("allows specification of async exec service", function() {
			expect(cyclon.builder().withAsyncExecService(new cyclon.AsyncExecService()).build() instanceof cyclon.CyclonNode).toBeTruthy();
		});

		it("allows specification of tick interval ms", function() {
			expect(cyclon.builder().withTickIntervalMs(1000).build() instanceof cyclon.CyclonNode).toBeTruthy();
		});
	});
});