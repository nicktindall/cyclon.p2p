import {EventEmitter} from 'events';
import Promise from 'bluebird';
import {Logger, AsyncExecService, UnreachableError} from 'cyclon.p2p-common';
import {Comms, MetadataProvider} from './Comms';
import {CyclonNode} from './CyclonNode';
import {Bootstrap} from './Bootstrap';
import {NeighbourSet} from './NeighbourSet';
import {CyclonNodePointer} from "./CyclonNodePointer";

export class CyclonNodeImpl extends EventEmitter implements CyclonNode {

    private readonly id: string;
    private lastShuffleNodeId?: string;
    private lastShuffleSet: CyclonNodePointer[];
    private shuffleTimer?: number;
    private started: boolean;

    constructor(private readonly neighbours: NeighbourSet,
                private readonly numNeighbours: number,
                private readonly bootstrapSize: number,
                private readonly shuffleSize: number,
                private readonly comms: Comms,
                private readonly bootstrapper: Bootstrap,
                private readonly tickIntervalMs: number,
                private readonly metadataProviders: {[key:string]: MetadataProvider},
                private readonly asyncExecService: AsyncExecService,
                private readonly logger: Logger) {
        super();
        if (shuffleSize > numNeighbours) {
            throw new Error("Shuffle size cannot be larger than the neighbour cache size!");
        }

        this.id = comms.getLocalId();
        this.lastShuffleSet = [];
        this.started = false;
    }

    /**
     * Get the ID of this node
     */
    getId(): string {
        return this.id;
    }

    getNeighbourSet(): NeighbourSet {
        return this.neighbours;
    }

    /**
     * Get the initial peer set, then start shuffling at regular intervals
     */
    start(): void {
        if (!this.started) {
            this.comms.initialize(this, this.metadataProviders);
            this.startShuffling();
            this.started = true;
        } else {
            this.logger.error("You can't start the node twice, are you insane!?");
        }
    }

    /**
     * Execute an "enhanced shuffle" with another node in the cache
     */
    private executeShuffle(): void {

        //
        // If we haven't heard back from our last shuffle request, delete that neighbour
        //
        if (this.lastShuffleNodeId !== undefined) {
            this.deleteLastShuffleState();
        }

        //
        // Increase the age of all neighbour
        // entries by one
        //
        this.neighbours.incrementAges();

        //
        // Choose the oldest neighbour
        //
        const oldestNeighbourId: string | undefined = this.neighbours.findOldestId();

        //
        // If we have an oldest neighbour, engage them in a shuffle
        //
        if (oldestNeighbourId !== undefined) {
            const shuffleSet = this.neighbours.selectShuffleSet(this.shuffleSize);

            //
            // Replace destination node's entry with a pointer to myself
            //
            for (let i = 0; i < shuffleSet.length; i++) {
                if (shuffleSet[i].id === oldestNeighbourId) {
                    shuffleSet[i] = this.createNewPointer();
                    break;
                }
            }

            this.lastShuffleNodeId = oldestNeighbourId;
            this.lastShuffleSet = shuffleSet;

            const outgoingPointer = <CyclonNodePointer>this.neighbours.get(oldestNeighbourId);
            this.emit("shuffleStarted", "outgoing", outgoingPointer);
            this.comms.sendShuffleRequest(outgoingPointer, shuffleSet)
                .then(() => {
                    this.emit("shuffleCompleted", "outgoing", outgoingPointer);
                })
                .catch(UnreachableError, () => {
                    this.emit("shuffleError", "outgoing", outgoingPointer, "unreachable");
                })
                .catch(Promise.TimeoutError, (e) => {
                    console.warn(e.message);
                    this.emit("shuffleTimeout", "outgoing", outgoingPointer);
                })
                .catch(Promise.CancellationError, () => {
                    this.emit("shuffleTimeout", "outgoing", outgoingPointer);
                })
                .catch((error) => {
                    this.logger.error("An unexpected error occurred sending a shuffle request to " + oldestNeighbourId, error);
                    this.emit("shuffleError", "outgoing", outgoingPointer, "unknown");
                })
                .then(() => this.deleteLastShuffleState());
        } else {
            //
            // Our neighbour cache is empty, try and bootstrap
            //
            this.stopShuffling();
            this.bootstrapNeighbourCache();
        }
    };

    /**
     * Create a new pointer to this Cyclon node
     */
    createNewPointer(): CyclonNodePointer {
        return this.comms.createNewPointer();
    }

    /**
     * Handle an inbound shuffle request
     */
    handleShuffleRequest(fromPointer: CyclonNodePointer, receivedSet: CyclonNodePointer[]): CyclonNodePointer[] {

        //
        // Send a random set back
        //
        const responseSet: CyclonNodePointer[] = this.neighbours.randomSelection(this.shuffleSize);

        //
        // Discard entries pointing to me, and entries already in my cache
        //
        const filteredSet = receivedSet.filter((pointer) => this.notMe(pointer));

        //
        // Populate cache with received set, first filling empty slots then replacing those sent in reply
        //
        this.incorporateSet(filteredSet, responseSet);

        //
        // Return the response set
        //
        return responseSet;
    };

    /**
     * Handle an inbound shuffle response
     */
    handleShuffleResponse(fromPointer: CyclonNodePointer, responseSet: CyclonNodePointer[]): void {
        if (fromPointer.id === this.lastShuffleNodeId) {
            const filteredSet = responseSet.filter((pointer) => this.notMe(pointer));
            this.incorporateSet(filteredSet, this.lastShuffleSet);
            this.deleteLastShuffleState();
        }
    };

    /**
     * Bootstrap the neighbour cache and begin shuffling
     */
    bootstrapNeighbourCache() {
        this.logger.info("Neighbour cache empty, attempting to bootstrap");
        this.emit("attemptingBootstrap");
        this.bootstrapper.getInitialPeerSet(this, this.bootstrapSize).then((initialPeerSet) => {
                initialPeerSet.forEach((peer) => {
                    this.neighbours.insert(peer);
                });

                this.startShuffling();
            })
            .catch((error:any) => {
                this.logger.error("Error bootstrapping peers", error);
            });
    }

    /**
     * Start shuffling every 'tickIntervalMs' milliseconds
     */
    startShuffling() {
        this.shuffleTimer = this.asyncExecService.setInterval(() => this.executeShuffle(), this.tickIntervalMs);
    }

    /**
     * Halt periodic shuffling
     */
    stopShuffling() {
        if (this.shuffleTimer !== undefined) {
            this.asyncExecService.clearInterval(this.shuffleTimer);
            delete this.shuffleTimer;
        }
    }

    /**
     * Incorporate a set of neighbours into the neighbour set
     *
     * @param neighboursToIncorporate The set of neighbours to incorporate
     * @param neighboursToReplace The set of neighbours to replace if we run out of space
     */
    private incorporateSet(neighboursToIncorporate: CyclonNodePointer[], neighboursToReplace: CyclonNodePointer[]) {
        neighboursToIncorporate.forEach((item) => {
            if (this.neighbours.contains(item.id)) {
                this.neighbours.mergeNodePointerIfNewer(item);
            } else {
                if (this.neighbours.size() >= this.numNeighbours) {
                    const toRemove = neighboursToReplace.pop();
                    if (toRemove !== undefined) {
                        this.neighbours.remove(toRemove.id);
                    } else {
                        this.logger.warn("Not enough neighboursToReplace");
                    }
                }
                this.neighbours.insert(item);
            }
        });
    }

    /**
     * The specified pointer doesn't point to me
     */
    private notMe(item: CyclonNodePointer): boolean {
        return item.id !== this.id;
    }

    /**
     * Delete the last shuffle state, and remove the last node shuffled with
     * from the cache
     */
    private deleteLastShuffleState() {
        if (this.lastShuffleNodeId) {
            this.neighbours.remove(this.lastShuffleNodeId);
        }
        this.lastShuffleNodeId = undefined;
        this.lastShuffleSet = [];
    }
}
