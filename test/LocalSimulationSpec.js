const {LocalSimulation} = require('../lib/LocalSimulation');

describe("The statistics functions used in local sim", () => {

    describe("The mean function", () => {

        it("should return the correct mean", () => {
            expect(LocalSimulation.mean([2, 4, 6, 8, 10])).toEqual(6);
        });

        it("should return undefined for an empty array", () => {
            expect(LocalSimulation.mean([])).toEqual(undefined);
        })
    });

    describe("The standard deviation function", () => {

        it("should return the standard deviation", () => {
            expect(LocalSimulation.standardDeviation([2, 4, 4, 4, 5, 5, 7, 9.])).toEqual(2);
        });

        it("Should return undefined for an empty array", () => {
            expect(LocalSimulation.standardDeviation([])).toEqual(undefined);
        })
    });

    describe("The frequency function", () => {

        it("should return the frequencies for values in an array", () => {
            let map = LocalSimulation.frequency(['aaa', 'vvv', 'aaa', 'bbb', 'bbb', 'bbb', 'ccc']);
            expect(map.get('aaa')).toEqual(2);
            expect(map.get('bbb')).toEqual(3);
            expect(map.get('ccc')).toEqual(1);
            expect(map.get('vvv')).toEqual(1);
        })
    });
});