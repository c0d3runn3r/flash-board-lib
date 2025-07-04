const assert = require('assert');
const dayjs = require('dayjs');
const Notion = require('../lib/Notion.js');

describe('Notion', () => {
    let notion;

    beforeEach(() => {
        notion = new Notion('testNotion', 'defaultValue');
    });

    describe('constructor', () => {
        it('should initialize with correct name and default value', () => {
            assert.strictEqual(notion.name, 'testNotion');
            assert.strictEqual(notion.value, 'defaultValue');
            assert.strictEqual(notion.timestamp, undefined);
        });
    });

    describe('name getter', () => {
        it('should return the notion name', () => {
            assert.strictEqual(notion.name, 'testNotion');
        });
    });

    describe('value getter and setter', () => {
        it('should return default value if no value is set', () => {
            assert.strictEqual(notion.value, 'defaultValue');
        });

        it('should set and get new value with updated timestamp', () => {
            const before = Date.now();
            notion.value = 'newValue';
            assert.strictEqual(notion.value, 'newValue');
            assert.ok(notion.timestamp instanceof Date);
            assert.ok(notion.timestamp.getTime() >= before);
        });
    });

    describe('timestamp getter', () => {
        it('should return undefined if no value is set', () => {
            assert.strictEqual(notion.timestamp, undefined);
        });

        it('should return Date object after setting value', () => {
            notion.value = 'test';
            assert.ok(notion.timestamp instanceof Date);
        });
    });

    describe('set_value', () => {
        it('should set value and timestamp with Date object', () => {
            const date = new Date('2025-01-01T12:00:00Z');
            notion.set_value('customValue', date);
            assert.strictEqual(notion.value, 'customValue');
            assert.ok(notion.timestamp instanceof Date);
            assert.strictEqual(notion.timestamp.getTime(), date.getTime());
        });

        it('should set value and timestamp with valid string', () => {
            const dateStr = '2025-01-01T12:00:00Z';
            const expectedDate = dayjs(dateStr).toDate();
            notion.set_value('stringTest', dateStr);
            assert.strictEqual(notion.value, 'stringTest');
            assert.strictEqual(notion.timestamp.getTime(), expectedDate.getTime());
        });

        it('should set value and timestamp with dayjs object', () => {
            const dayjsObj = dayjs('2025-01-01T12:00:00Z');
            const expectedDate = dayjsObj.toDate();
            notion.set_value('dayjsTest', dayjsObj);
            assert.strictEqual(notion.value, 'dayjsTest');
            assert.strictEqual(notion.timestamp.getTime(), expectedDate.getTime());
        });

        it('should throw error for invalid timestamp string', () => {
            assert.throws(
                () => notion.set_value('value', 'invalid-date'),
                /Invalid timestamp string/
            );
        });

        it('should throw error for invalid timestamp type', () => {
            assert.throws(
                () => notion.set_value('value', 123),
                /Invalid timestamp type/
            );
        });

        it('should emit changed event with correct properties', (done) => {
            notion.on('changed', (event) => {
                assert.strictEqual(event.property, 'testNotion');
                assert.strictEqual(event.old_value, undefined);
                assert.strictEqual(event.new_value, 'eventTest');
                done();
            });
            notion.set_value('eventTest', new Date());
        });
    });

    describe('setter_mapping', () => {

        it('should throw if setter_mapping is missing value or timestamp keys', () => {
            assert.throws(() => {
                new Notion('bad', 'x', {});
            }, /setter_mapping must have a "value" key/);

            assert.throws(() => {
                new Notion('bad', 'x', { value: 'v' });
            }, /setter_mapping must have a "timestamp" key/);

            assert.throws(() => {
                new Notion('bad', 'x', { value: 123, timestamp: 't' });
            }, /setter_mapping must have a "value" key/);
        });

        it('should use mapped keys if present in value object', () => {
            const notion = new Notion('mapped', 'x', { value: 'v', timestamp: 't' });
            const ts = new Date('2025-01-01T00:00:00Z');
            notion.set_value({ v: 'fromObject', t: ts }, 'ignored');
            assert.strictEqual(notion.value, 'fromObject');
            assert.strictEqual(notion.timestamp.getTime(), ts.getTime());
        });

        it('should fall back to raw value and timestamp if mapped keys missing', () => {
            const notion = new Notion('fallback', 'x', { value: 'v', timestamp: 't' });
            const ts = new Date('2025-01-02T00:00:00Z');
            notion.set_value('fallbackValue', ts);
            assert.strictEqual(notion.value, 'fallbackValue');
            assert.strictEqual(notion.timestamp.getTime(), ts.getTime());
        });
    });


});