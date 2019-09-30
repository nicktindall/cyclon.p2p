import {Collection, Vector} from 'gauss';
import {builder} from './index';
import {LocalComms} from './LocalComms'
import {NeighbourSet} from './NeighbourSet'
import {LocalBootstrap} from './LocalBootstrap'
import {CyclonNode} from './CyclonNode'
import {CyclonNodePointer} from "./CyclonNodePointer";

/**
 * A local Cyclon.p2p simulation
 *
 * @param numberOfNodes The number of nodes to simulate
 */
export class LocalSimulation {

    private readonly allNodes: { [id: string]: CyclonNode };
    private readonly localBootstrap: LocalBootstrap;
    private readonly nodes: CyclonNode[];
    private readonly neighbourSets: NeighbourSet[];
    private readonly peerSequences: { [id: string]: string[] };
    private readonly idealEntropy: number;

    constructor(numberOfNodes: number) {
        this.allNodes = {};
        this.localBootstrap = new LocalBootstrap(numberOfNodes);
        this.nodes = [];
        this.neighbourSets = [];
        this.peerSequences = {};

        const idealSequence = [];
        for (let nodeId = 0; nodeId < numberOfNodes; nodeId++) {
            const nodeIdString = String(nodeId);
            idealSequence.push(nodeIdString);
            const cyclonNode = builder(new LocalComms(nodeIdString, this.allNodes), this.localBootstrap)
                .withTickIntervalMs(1000)
                .build();

            this.nodes.push(cyclonNode);
            const neighbourSet = cyclonNode.getNeighbourSet();
            this.neighbourSets.push(neighbourSet);

            // Peer sequence recorder
            neighbourSet.on("change", this.peerSequenceAppenderFor(nodeIdString));
        }

        this.idealEntropy = LocalSimulation.calculateEntropy(idealSequence.slice(1));
    }

    /**
     * Get the "ideal" entropy for a peer sequence given the number of nodes in the simulation
     */
    getIdealEntropy(): number {
        return this.idealEntropy;
    }

    /**
     * Start the simulation
     */
    startSimulation(): void {
        this.nodes.forEach(function (node: CyclonNode) {
            node.start();
        });
    }

    /**
     * Get the stats for the current state of the network
     */
    getNetworkStatistics() {
        const entropyValuesVector = this.getEntropyValues();
        const inDegreeVector = this.getInDegreeValues();

        return {
            entropy: {
                min: entropyValuesVector.min(),
                mean: entropyValuesVector.mean(),
                max: entropyValuesVector.max()
            },
            inDegree: {
                mean: inDegreeVector.mean(),
                standardDeviation: inDegreeVector.stdev()
            },
            orphanCount: inDegreeVector.frequency(0)
        };
    }

    /**
     * Get a vector containing the in-degree of every node in the network
     */
    getInDegreeValues(): Vector {
        const inDegrees: { [id: string]: number } = {};

        this.neighbourSets.forEach((neighbourSet) => {
            for (const id in this.allNodes) {
                const increment = neighbourSet.contains(id) ? 1 : 0;
                inDegrees[id] = inDegrees[id] === undefined ? increment : inDegrees[id] + increment;
            }
        });

        const inDegreesArray = [];
        for (const key in inDegrees) {
            const countForKey = inDegrees[key];
            inDegreesArray.push(countForKey);
        }

        return new Vector(inDegreesArray);
    }

    /**
     * Get a vector containing the peer stream entropy of every node in the network
     */
    getEntropyValues(): Vector {
        const entropyValues = [];

        for (const nodeId in this.peerSequences) {
            entropyValues.push(this.calculateEntropyForNode(nodeId));
        }

        return new Vector(entropyValues);
    }

    /**
     * Create a peer sequence appender for a particular node
     *
     * @param nodeId The ID of the node whose sequence to append to
     */
    private peerSequenceAppenderFor(nodeId: string) {
        return (type: string, neighbour: CyclonNodePointer) => {
            if (type === "insert") {
                this.appendPeerToSequence(nodeId, neighbour);
            }
        };
    }

    /**
     * Append a peer's ID to the sequence for a particular node
     *
     * @param nodeId The ID of the node whose sequence to append
     * @param nextPointer The pointer to the peer to append
     */
    private appendPeerToSequence(nodeId: string, nextPointer: CyclonNodePointer) {
        if (!this.peerSequences.hasOwnProperty(nodeId)) {
            this.peerSequences[nodeId] = [];
        }
        this.peerSequences[nodeId].push(nextPointer.id);
    }

    /**
     * Calculate the entropy of the peer sequence for a node
     *
     * @param nodeId The node whose sequence to analyse
     */
    private calculateEntropyForNode(nodeId: string) {
        return LocalSimulation.calculateEntropy(this.peerSequences[nodeId]);
    }

    private static calculateEntropy(peerSequence: string[]): number {
        const sequenceLength = peerSequence.length;

        const counts = new Collection(peerSequence).distribution();
        const distinctIds = Object.keys(counts);
        let entropy: number = 0;
        for (let i = 0, distinctIdCount = distinctIds.length; i < distinctIdCount; i++) {
            const currentId = distinctIds[i];
            const probability = counts[currentId] / sequenceLength;
            entropy = entropy + (probability * LocalSimulation.log2(probability));
        }

        return -1 * entropy;
    }

    private static log2(number: number) {
        return Math.log(number) / Math.log(2);
    }
}
