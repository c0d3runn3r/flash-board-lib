const assert = require('node:assert');
const Segment = require('../lib/Segment.js');
const Asset = require('../lib/Asset.js');
const Element = require('../lib/Element.js');

describe('Segment', () => {
  let boardMock;
  class Board { element_factory(_,params) { return new Element(params); } }

  beforeEach(() => {
    boardMock = new Board();
  });

  describe('constructor', () => {
    it('should create segment with default properties', () => {
      const segment = new Segment({}, boardMock);
      assert.strictEqual(segment.name, 'Segment');
      assert.deepStrictEqual(segment.assets, []);
      assert.deepStrictEqual(segment.elements, []);
    });

    it('should create segment with custom name and elements', () => {
      const config = {
        name: 'TestSegment',
        elements: [{ class: 'Element', static: true }]
      };
      const segment = new Segment(config, boardMock);
      assert.strictEqual(segment.name, 'TestSegment');
      assert.strictEqual(segment.elements.length, 1);
      assert.ok(segment.elements[0] instanceof Element);
      assert.strictEqual(segment.elements[0].static, true);
    });


  });

  describe('find_by_id', () => {
    it('should find asset by ID', () => {
      const segment = new Segment({}, boardMock);
      const asset = new Asset({ id: 'test_id' });
      segment.add_asset(asset);
      const found = segment.find_asset('test_id');
      assert.strictEqual(found, asset);
    });

    it('should return null for non-existent ID', () => {
      const segment = new Segment({}, boardMock);
      const found = segment.find_asset('non_existent');
      assert.strictEqual(found, null);
    });

    it('should throw error for invalid ID', () => {
      const segment = new Segment({}, boardMock);
      assert.throws(() => {
        segment.find_asset('');
      }, /Asset ID must be a non-empty string/);
    });
  });

  describe('add_asset', () => {
    it('should add asset successfully', () => {
      const segment = new Segment({}, boardMock);
      const asset = new Asset({ id: 'test_id' });
      const result = segment.add_asset(asset);
      assert.strictEqual(result, true);
      assert.deepStrictEqual(segment.assets, [asset]);
    });

    it('should throw error for non-Asset instance', () => {
      const segment = new Segment({}, boardMock);
      assert.throws(() => {
        segment.add_asset({});
      }, /Only instances of Asset can be added/);
    });

    it('should throw error for duplicate asset ID', () => {
      const segment = new Segment({}, boardMock);
      const asset = new Asset({ id: 'test_id' });
      segment.add_asset(asset);
      assert.throws(() => {
        segment.add_asset(new Asset({ id: 'test_id' }));
      }, /Asset with ID test_id already exists/);
    });

    it('should add asset and pair with element based on assets_to_elements', () => {
      const segment = new Segment({
        assets_to_elements: { TestAsset: Element }
      }, boardMock);
      const TestAsset = class TestAsset extends Asset {};
      const asset = new TestAsset({ id: 'test_id' });
      const result = segment.add_asset(asset);
      assert.strictEqual(result, true);
      assert.strictEqual(segment.assets.length, 1);
      assert.strictEqual(segment.elements.length, 1);
      assert.strictEqual(segment.elements[0].asset, asset);
    });
  });

  describe('remove_asset', () => {
    it('should remove asset successfully', () => {
      const segment = new Segment({}, boardMock);
      const asset = new Asset({ id: 'test_id' });
      segment.add_asset(asset);
      const result = segment.remove_asset('test_id');
      assert.strictEqual(result, true);
      assert.deepStrictEqual(segment.assets, []);
    });

    it('should return false for non-existent asset', () => {
      const segment = new Segment({}, boardMock);
      const result = segment.remove_asset('non_existent');
      assert.strictEqual(result, false);
    });

    it('should throw error for invalid ID', () => {
      const segment = new Segment({}, boardMock);
      assert.throws(() => {
        segment.remove_asset('');
      }, /Asset ID must be a non-empty string/);
    });

    it('should unpair asset from element and prune non-static elements', () => {
      const segment = new Segment({
        assets_to_elements: { TestAsset: Element }
      }, boardMock);
      const TestAsset = class TestAsset extends Asset {};
      const asset = new TestAsset({ id: 'test_id' });
      segment.add_asset(asset);
      assert.strictEqual(segment.elements.length, 1);
      const result = segment.remove_asset('test_id');
      assert.strictEqual(result, true);
      assert.deepStrictEqual(segment.assets, []);
      assert.deepStrictEqual(segment.elements, []); // Non-static element pruned
    });
  });
});