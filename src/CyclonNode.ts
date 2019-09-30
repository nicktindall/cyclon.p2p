import {NeighbourSet} from './NeighbourSet';
import {CyclonNodePointer} from "./CyclonNodePointer";

export interface CyclonNode {

    getId(): string;

    handleShuffleRequest(fromPointer: CyclonNodePointer, receivedSet: CyclonNodePointer[]): CyclonNodePointer[];

    handleShuffleResponse(fromPointer: CyclonNodePointer, responseSet: CyclonNodePointer[]): void;

    getNeighbourSet(): NeighbourSet

    start(): void;
}
