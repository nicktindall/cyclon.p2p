import {Comms, MetadataProvider} from './Comms';
import {CyclonNode} from './CyclonNode';
import {CyclonNodePointer} from "./CyclonNodePointer";

export class LocalComms implements Comms {

    private localNode?: CyclonNode;
    private localSequence: number = 0;

    constructor(private localId: string, private allNodes: { [id: string]: CyclonNode }) {
    }

    initialize(localNode: CyclonNode, metadataProviders: { [key: string]: MetadataProvider }): void {
        this.localNode = localNode;
        this.allNodes[this.localNode.getId()] = localNode;
    }

    /**
     * Send a shuffle request to another node
     */
    sendShuffleRequest(destinationNodePointer: CyclonNodePointer, shuffleSet: CyclonNodePointer[]): Promise<void> {
        const responseSet = this.allNodes[destinationNodePointer.id].handleShuffleRequest(this.createNewPointer(), shuffleSet);
        this.allNodes[this.localId].handleShuffleResponse(destinationNodePointer, responseSet);
        return Promise.resolve();
    }

    getLocalId(): string {
        return this.localId;
    }

    createNewPointer(): CyclonNodePointer {
        return {
            id: this.localId,
            metadata: {},
            age: 0,
            seq: this.localSequence++
        }
    }
}

