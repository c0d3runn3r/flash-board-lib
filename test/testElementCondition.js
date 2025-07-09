const assert = require('node:assert');
const ElementCondition = require('../lib/ElementCondition.js');

describe('ElementCondition', () => {
    describe('constructor', () => {
        it('should create element with default properties', () => {
            const elementCondition = new ElementCondition();
            assert.strictEqual(elementCondition.condition, 'green');
            assert.strictEqual(elementCondition.trend, 'unknown');
        });
    });

    describe('.condition', () => {
        it('should return the current condition', () => {
            const elementCondition = new ElementCondition('yellow');
            assert.strictEqual(elementCondition.condition, 'yellow');
        });

        it('should set a valid condition', () => {
            const elementCondition = new ElementCondition();
            elementCondition.condition = 'red';
            assert.strictEqual(elementCondition.condition, 'red');
        });

        it('should throw an error for invalid condition', () => {
            const elementCondition = new ElementCondition();
            assert.throws(() => { elementCondition.condition = 'invalid'; }, /Invalid condition/);
        });
    });

    describe('.trend', () => {
        it('should return the current trend', () => {
            const elementCondition = new ElementCondition('green', 'yellow');
            assert.strictEqual(elementCondition.trend, 'yellow');
        });

        it('should set a valid trend', () => {
            const elementCondition = new ElementCondition();
            elementCondition.trend = 'red';
            assert.strictEqual(elementCondition.trend, 'red');
        });

        it('should throw an error for invalid trend', () => {
            const elementCondition = new ElementCondition();
            assert.throws(() => { elementCondition.trend = 'invalid'; }, /Invalid trend/);
        });
    });
    
    describe('.compare', () => {
        it('should sort conditions by condition then trend', () => {
            const input = [
                new ElementCondition('yellow', 'red'),
                new ElementCondition('green', 'green'),
                new ElementCondition('yellow', 'unknown'),
                new ElementCondition('green', 'red'),
                new ElementCondition('red', 'yellow'),
                new ElementCondition('unknown', 'green'),
                new ElementCondition('unknown', 'red')
            ];

            input.sort(ElementCondition.compare);

            const result = input.map(ec => `${ec.condition}:${ec.trend}`);

            assert.deepStrictEqual(result, [
                'unknown:green',
                'unknown:red',
                'green:green',
                'green:red',
                'yellow:unknown',
                'yellow:red',
                'red:yellow'
            ]);
        });
    });



});
