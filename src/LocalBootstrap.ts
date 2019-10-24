import {CyclonNode} from './CyclonNode';
import {Bootstrap} from './Bootstrap';
import {CyclonNodePointer} from "./CyclonNodePointer";

export class LocalBootstrap implements Bootstrap {

    constructor(private numNodes: number) {
    }

    /**
     * Peers are just given pointers to their neighbour to start with in the local simulation
     */
    getInitialPeerSet(cyclonNode: CyclonNode, limit: number): Promise<CyclonNodePointer[]> {
        return Promise.resolve([
            {id: String((Number(cyclonNode.getId()) + 1) % this.numNodes), age: 0, seq: 0, metadata: {}}
        ]);
    };
}
