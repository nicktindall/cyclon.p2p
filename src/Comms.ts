import {CyclonNode} from './CyclonNode';
import {CyclonNodePointer} from "./CyclonNodePointer";

export interface Comms {

    initialize(localNode: CyclonNode, metadataProviders: { [key: string]: MetadataProvider }): void;

    getLocalId(): string;

    createNewPointer(): CyclonNodePointer;

    sendShuffleRequest(outgoingPointer: CyclonNodePointer, shuffleSet: CyclonNodePointer[]): Promise<void>
}

export type MetadataProvider = Function;