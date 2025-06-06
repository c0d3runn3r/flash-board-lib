const assert = require('assert');
const Board = require('../lib/Board');
const Asset = require('../lib/Asset');
const Segment = require('../lib/Segment');
const GeoSegment = require('../lib/GeoSegment');
const fs = require('fs');
const path = require('path');

describe('Board constructor with board.conf', () => {
  it('should create a board with one GeoSegment and one Segment from board.conf', () => {
    // Read and parse the board.conf file
    const configPath = path.join(__dirname, 'data', 'board.conf');
    const configContent = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configContent);

    // Create a new Board instance with the config
    const board = new Board(config);

    // Verify the board name
    assert.strictEqual(board.name, 'Dax Command', 'Board name should match config');

    // Verify the number of segments
    assert.strictEqual(board.segments.length, 2, 'Board should have two segments');

    // Verify the segments
    const geoSegment = board.segments.find(s => s instanceof GeoSegment);
    const segment = board.segments.find(s => s instanceof Segment && !(s instanceof GeoSegment));

    assert.ok(geoSegment, 'Board should have one GeoSegment');
    assert.strictEqual(geoSegment.name, 'Philomath HQ', 'GeoSegment name should match config');

    assert.ok(segment, 'Board should have one Segment');
    assert.strictEqual(segment.name, 'Corvallis HQ', 'Segment name should match config');
  });
});

describe('Board', () => {
  let board;

  beforeEach(() => {
    board = new Board();
  });

  describe('add_asset', () => {
    it('should add a valid asset to the board', () => {
      const asset = new Asset({ id: 'test-asset', name: 'Test Asset' });
      board.add_asset(asset);
      assert.strictEqual(board.assets.length, 1, 'Asset added to board');
      assert.strictEqual(board.assets[0], asset, 'Correct asset added');
    });

    it('should throw error for non-Asset instances', () => {
      assert.throws(() => {
        board.add_asset({ id: 'invalid' });
      }, /Only instances of Asset can be added/, 'Non-Asset instance throws error');
    });

    it('should throw error for asset with invalid ID', () => {
      assert.throws(() => {
        board.add_asset(new Asset({ id: '' }));
      }, /Asset ID must be a non-empty string/, 'Empty ID throws error');

      assert.throws(() => {
        board.add_asset(new Asset({ id: null }));
      }, /Asset ID must be a non-empty string/, 'Null ID throws error');
    });

    it('should throw error for duplicate asset ID', () => {
      const asset1 = new Asset({ id: 'test-asset', name: 'Asset 1' });
      board.add_asset(asset1);
      const asset2 = new Asset({ id: 'test-asset', name: 'Asset 2' });
      assert.throws(() => {
        board.add_asset(asset2);
      }, /Asset with ID test-asset already exists/, 'Duplicate ID throws error');
    });
  });

  describe('find_by_id', () => {
    it('should find an asset by ID', () => {
      const asset = new Asset({ id: 'test-asset', name: 'Test Asset' });
      board.add_asset(asset);
      const found = board.find_asset_by_id('test-asset');
      assert.strictEqual(found, asset, 'Asset found by ID');
    });

    it('should return null for non-existent ID', () => {
      const found = board.find_asset_by_id('non-existent');
      assert.strictEqual(found, null, 'Non-existent ID returns null');
    });

    it('should throw error for invalid ID', () => {
      assert.throws(() => {
        board.find_asset_by_id('');
      }, /Asset ID must be a non-empty string/, 'Empty ID throws error');

      assert.throws(() => {
        board.find_asset_by_id(null);
      }, /Asset ID must be a non-empty string/, 'Null ID throws error');
    });
  });

  describe('remove_asset', () => {
    it('should remove an asset by ID', () => {
      const asset = new Asset({ id: 'test-asset', name: 'Test Asset' });
      board.add_asset(asset);
      const removed = board.remove_asset('test-asset');
      assert.strictEqual(removed, true, 'Asset removed successfully');
      assert.strictEqual(board.assets.length, 0, 'Asset list is empty');
      assert.strictEqual(board.find_asset_by_id('test-asset'), null, 'Asset no longer exists');
    });

    it('should return false for non-existent ID', () => {
      const removed = board.remove_asset('non-existent');
      assert.strictEqual(removed, false, 'Non-existent ID returns false');
      assert.strictEqual(board.assets.length, 0, 'Asset list remains empty');
    });

    it('should throw error for invalid ID', () => {
      assert.throws(() => {
        board.remove_asset('');
      }, /Asset ID must be a non-empty string/, 'Empty ID throws error');

      assert.throws(() => {
        board.remove_asset(null);
      }, /Asset ID must be a non-empty string/, 'Null ID throws error');
    });
  });

  describe('clear_assets', () => {
    it('should clear all assets from the board', () => {
      const asset1 = new Asset({ id: 'asset1', name: 'Asset 1' });
      const asset2 = new Asset({ id: 'asset2', name: 'Asset 2' });
      board.add_asset(asset1);
      board.add_asset(asset2);
      board.clear_assets();
      assert.strictEqual(board.assets.length, 0, 'All assets cleared');
    });
  });

  describe('assets getter', () => {
    it('should return an array of all assets', () => {
      const asset1 = new Asset({ id: 'asset1', name: 'Asset 1' });
      const asset2 = new Asset({ id: 'asset2', name: 'Asset 2' });
      board.add_asset(asset1);
      board.add_asset(asset2);
      assert.deepStrictEqual(board.assets, [asset1, asset2], 'Assets getter returns correct array');
    });

    it('should return empty array for new board', () => {
      assert.deepStrictEqual(board.assets, [], 'New board has empty assets array');
    });
  });
});