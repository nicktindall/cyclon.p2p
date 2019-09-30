import {EventEmitter} from 'events';
import {Logger, randomSample} from "cyclon.p2p-common";
import {CyclonNodePointer} from "./CyclonNodePointer";

export class NeighbourSet extends EventEmitter {

    private readonly neighbours: Map<string, CyclonNodePointer>;

    constructor(private readonly logger: Logger) {
        super();
        this.neighbours = new Map<string, CyclonNodePointer>();
    }

    /**
     * Return a copy of the contents map
     */
    getContents(): Map<string, CyclonNodePointer> {
        return JSON.parse(JSON.stringify(this.neighbours));
    }

    /**
     * Does the set contain the neighbour with the specified ID?
     */
    contains(neighbourId: string): boolean {
        return this.neighbours.has(neighbourId);
    }

    /**
     * Insert a neighbour into the set
     */
    insert(neighbour: CyclonNodePointer): void {
        if (neighbour.id === null || typeof (neighbour.id) === "undefined") {
            throw new Error("Attempted to add invalid neighbour " + JSON.stringify(neighbour));
        }
        this.neighbours.set(neighbour.id, neighbour);
        this.emit("change", "insert", neighbour);
    };

    /**
     * Remove the neighbour with the specified ID from the set
     */
    remove(neighbourId: string): void {
        const removed = this.neighbours.delete(neighbourId);
        this.emit("change", "remove", removed);
    }

    /**
     * Get the neighbour with the specified ID
     */
    get(id: string): CyclonNodePointer | undefined {
        return this.neighbours.get(id);
    }

    /**
     * Get the number of neighbours in the set
     */
    size(): number {
        return this.neighbours.size;
    }

    /**
     * Select a set for a shuffle
     */
    selectShuffleSet(shuffleSize: number): CyclonNodePointer[] {
        const oldestId = this.findOldestId();

        if (oldestId !== undefined) {
            const otherIds = Array.from(this.neighbours.keys()).filter(function (item) {
                return item !== oldestId;
            });
            const sample: string[] = [oldestId].concat(randomSample(otherIds, shuffleSize - 1));
            return sample.map(id => <CyclonNodePointer>this.get(id));
        } else {
            return [];
        }
    }

    /**
     * Find the ID of the oldest neighbour entry
     */
    findOldestId(): string | undefined {
        let oldestAge: number = -1;
        let oldestId: string | undefined;
        for (const entry of this.neighbours.values()) {
            if (entry.age > oldestAge) {
                oldestAge = entry.age;
                oldestId = entry.id;
            }
        }

        return oldestId;
    }

    /**
     * Choose a random set of neighbours
     */
    randomSelection(setSize: number): CyclonNodePointer[] {
        return randomSample(Array.from(this.neighbours.values()), setSize);
    }

    /**
     * Increment the age of each neighbour by one
     */
    incrementAges(): void {
        for(const node of this.neighbours.values()) {
            node.age = node.age + 1;
        }
    }

    /**
     * Update the node pointer if the witnessed pointer's sequence
     * is higher than the one we have. Keep the current age though.
     */
    mergeNodePointerIfNewer(node: CyclonNodePointer): void {
        const myNode = this.get(node.id);
        if (myNode) {
            if (myNode.seq < node.seq) {
                node.age = myNode.age;
                this.neighbours.set(node.id, node);
                this.emit("change", "update", node);
            }
        } else {
            this.logger.warn("Attempt was made to merge node not in set");
        }
    }
}
