cyclon.p2p
==========

[![Build Status](https://travis-ci.org/nicktindall/cyclon.p2p.svg?branch=master)](https://travis-ci.org/nicktindall/cyclon.p2p)
[![Dependencies](https://david-dm.org/nicktindall/cyclon.p2p.png)](https://david-dm.org/nicktindall/cyclon.p2p)

A Javascript implementation of the Cyclon peer sampling protocol

The Cyclon protocol is described in;

Voulgaris, S.; Gavidia, D. & van Steen, M. (2005), 'CYCLON: Inexpensive Membership Management for Unstructured P2P Overlays', J. Network Syst. Manage. 13 (2) .

Overview
--------
The cyclon.p2p implementation has two dependencies, a `Bootstrap` and a `Comms` instance. Their functions and interfaces are described below.

### Bootstrap
The purpose of the bootstrap is to retrieve some peers to initially populate a node's neighbour cache. Its interface is quite simple.

#### `getInitialPeerSet(localNode, maxPeers)`
Get an initial set of peers. Returns a [Bluebird](https://github.com/petkaantonov/bluebird) promise that will resolve to a set of peers no greater than the specified limit.

##### Parameters
* **localNode** The CyclonNode that is requesting the peers.
* **limit** The maximum number of peers to return.

### Comms
The Comms is the layer that takes care of a node's communication with other nodes. It is responsible for executing shuffles for the local node. Its interface is again quite simple.

#### `initialize(localNode, metadataProviders)`
Initialize the Comms instance.

##### Parameters
* **localNode** A reference to the local CyclonNode.
* **metadataProviders** A JavaScript Object whose keys will be used as node pointer metadata keys and values will be executed to get the corresponding values.

#### `sendShuffleRequest(destinationNodePointer, shuffleSet)`
Send a shuffle request to another node in the network. Returns a cancellable Bluebird promise that will resolve when a shuffle has been successfully executed. If a cancellation or error occurs it will reject with the error.

##### Parameters
* **destinationNodePointer** The node pointer of the destination node
* **shuffleSet** The set of node pointers to include in the shuffle request message

#### `createNewPointer()`
Create a new pointer to the local node, containing the current metadata and signalling details.

#### `getLocalId()`
Return the string which the Comms layer is using to identify the local node.