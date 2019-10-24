import {CyclonNode} from './CyclonNode';
import {CyclonNodePointer} from "./CyclonNodePointer";

export interface Bootstrap {
    getInitialPeerSet(cyclonNode: CyclonNode, bootstrapSize: number): Promise<CyclonNodePointer[]>;
}