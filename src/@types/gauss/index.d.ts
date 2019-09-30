/**
 * Could not locate types for gauss so I made my own
 */
declare module 'gauss' {

    export class Collection {

        constructor(values: string[]);

        distribution(): { [val: string]: number }
    }

    export class Vector {

        constructor(values: number[]);

        min(): number;

        mean(): number;

        max(): number;

        stdev(): number;

        frequency(ofValue: number): { [val: number]: number }
    }
}