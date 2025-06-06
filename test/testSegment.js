const assert = require('assert');
const Segment = require('../lib/Segment');
const Asset = require('../lib/Asset');

describe('Segment', () => {
  describe('constructor', () => {
    it('should create Segment with valid name', () => {
      const segment = new Segment({ name: 'Test Segment' });
      assert.strictEqual(segment.name, 'Test Segment', 'Name set correctly');
    });

    it('should create Segment with empty name if none provided', () => {
      const segment = new Segment();
      assert.strictEqual(segment.name, '', 'Empty name set correctly');
    });
  });

  describe('add_asset', () => {
    let segment;
    let asset1;
    let asset2;

    beforeEach(() => {
      // Create a new Segment
      segment = new Segment({ name: 'Test Segment' });

      // Create assets
      asset1 = new Asset({ id: 'asset1', last_seen: null });
      asset2 = new Asset({ id: 'asset2', last_seen: null });
    });

    it('should add asset to segment', () => {
      const added = segment.add_asset(asset1);
      assert.strictEqual(added, true, 'Asset1 added to segment');
      assert.strictEqual(segment.assets.length, 1, 'One asset in segment');
      assert.strictEqual(segment.find_by_id('asset1'), asset1, 'Asset1 found in segment');
    });

    it('should throw error for non-Asset instances', () => {
      assert.throws(() => {
        segment.add_asset({ id: 'invalid' });
      }, /Only instances of Asset can be added/, 'Non-Asset instance throws error');
    });

    it('should throw error for duplicate asset ID', () => {
      segment.add_asset(asset1);
      const duplicateAsset = new Asset({ id: 'asset1', last_seen: null });
      assert.throws(() => {
        segment.add_asset(duplicateAsset);
      }, /Asset with ID asset1 already exists/, 'Duplicate ID throws error');
    });

    it('should add multiple unique assets', () => {
      const added1 = segment.add_asset(asset1);
      const added2 = segment.add_asset(asset2);
      assert.strictEqual(added1, true, 'Asset1 added to segment');
      assert.strictEqual(added2, true, 'Asset2 added to segment');
      assert.strictEqual(segment.assets.length, 2, 'Two assets in segment');
      assert.strictEqual(segment.find_by_id('asset1'), asset1, 'Asset1 found in segment');
      assert.strictEqual(segment.find_by_id('asset2'), asset2, 'Asset2 found in segment');
    });
  });
});