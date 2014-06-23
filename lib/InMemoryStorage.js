'use strict';

/**
	An in-memory (partial) implementation of the DOM storage interface
*/
function InMemoryStorage() {

	var store = {};

	this.getItem = function(key) {
		return store[key] || null;
	};

	this.setItem = function(key, value) {
		store[key] = value;
	};

	this.removeItem = function(key) {
		store.delete(key);
	};

	this.clear = function() {
		store = {};
	};
}

module.exports = InMemoryStorage;