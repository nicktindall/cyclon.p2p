import {AsyncExecService, Logger, consoleLogger, asyncExecService, newInMemoryStorage} from 'cyclon.p2p-common';
import {Comms, MetadataProvider} from './Comms';
import {CyclonNodeImpl} from './CyclonNodeImpl';
import {NeighbourSet} from './NeighbourSet';
import {LocalComms} from './LocalComms';
import {LocalBootstrap} from './LocalBootstrap';
import {LocalSimulation} from './LocalSimulation';
import {Bootstrap} from './Bootstrap';
import {CyclonNode} from './CyclonNode';
import {CyclonNodePointer} from "./CyclonNodePointer";

const DEFAULT_NUM_NEIGHBOURS = 20;
const DEFAULT_BOOTSTRAP_SIZE = 1;
const DEFAULT_SHUFFLE_SIZE = 5;
const DEFAULT_TICK_INTERVAL_MS = 30000;

/**
 * A builder for CyclonNode instances
 */
export class CyclonNodeBuilder {

    private numNeighbours: number;
    private bootstrapSize: number;
    private shuffleSize: number;
    private tickIntervalMs: number;
    private metadataProviders: { [key: string]: MetadataProvider };
    private asyncExecService: AsyncExecService;
    private logger: Logger;
    private storage: Storage;

    constructor(private comms: Comms, private bootstrap: Bootstrap) {
        this.numNeighbours = DEFAULT_NUM_NEIGHBOURS;
        this.bootstrapSize = DEFAULT_BOOTSTRAP_SIZE;
        this.shuffleSize = DEFAULT_SHUFFLE_SIZE;
        this.tickIntervalMs = DEFAULT_TICK_INTERVAL_MS;
        this.metadataProviders = {};
        this.asyncExecService = asyncExecService();
        this.logger = consoleLogger();
        this.storage = newInMemoryStorage();
    }

    withLogger(newLogger: Logger): CyclonNodeBuilder {
        this.logger = newLogger;
        return this;
    }

    withNumNeighbours(newNumNeighbours: number): CyclonNodeBuilder {
        this.numNeighbours = newNumNeighbours;
        return this;
    }

    withBootstrapSize(newBootstrapSize: number): CyclonNodeBuilder {
        this.bootstrapSize = newBootstrapSize;
        return this;
    }

    withShuffleSize(newShuffleSize: number): CyclonNodeBuilder {
        this.shuffleSize = newShuffleSize;
        return this;
    }

    withStorage(newStorage: Storage): CyclonNodeBuilder {
        this.storage = newStorage;
        return this;
    }

    withMetadataProviders(newMetadataProviders: { [id: string]: MetadataProvider }): CyclonNodeBuilder {
        this.metadataProviders = newMetadataProviders;
        return this;
    }

    withAsyncExecService(newAsyncExecService: AsyncExecService): CyclonNodeBuilder {
        this.asyncExecService = newAsyncExecService;
        return this;
    }

    withTickIntervalMs(newTickIntervalMs: number): CyclonNodeBuilder {
        this.tickIntervalMs = newTickIntervalMs;
        return this;
    };

    build(): CyclonNode {
        const neighbours = new NeighbourSet(this.logger);
        return new CyclonNodeImpl(neighbours, this.numNeighbours, this.bootstrapSize, this.shuffleSize, this.comms, this.bootstrap,
            this.tickIntervalMs, this.metadataProviders, this.asyncExecService, this.logger);
    };
}

export function builder(comms: Comms, bootstrap: Bootstrap): CyclonNodeBuilder {
    return new CyclonNodeBuilder(comms, bootstrap);
}

export {CyclonNode, CyclonNodeImpl, Comms, CyclonNodePointer, MetadataProvider, Bootstrap, LocalComms, LocalBootstrap, NeighbourSet, LocalSimulation};