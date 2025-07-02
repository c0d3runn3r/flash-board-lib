const assert = require('assert');
const Asset = require('../lib/Asset');

describe('Asset', () => {
  describe('constructor', () => {
    it('should instantiate a new Asset with valid properties including id', () => {
      const asset = new Asset({ id: 'test-asset', name: 'Test Asset' });
      assert.strictEqual(asset instanceof Asset, true, 'Asset instance created');
      assert.strictEqual(asset.id, 'test-asset', 'ID set correctly');
    });

    it('should throw error if id is not defined or invalid', () => {
      assert.throws(() => {
        new Asset({});
      }, /Asset ID must be a non-empty string/, 'Missing id throws error');

      assert.throws(() => {
        new Asset({ id: '' });
      }, /Asset ID must be a non-empty string/, 'Empty string id throws error');

      assert.throws(() => {
        new Asset({ id: null });
      }, /Asset ID must be a non-empty string/, 'Null id throws error');
    });
  });

  describe('id getter', () => {
    it('should return the correct ID', () => {
      const assetId = 'test-asset-123';
      const asset = new Asset({ id: assetId });
      assert.strictEqual(asset.id, assetId, 'ID getter returns correct ID');
    });
  });

  describe('property getter and setter', () => {
    it('should get and set properties correctly', () => {
      const asset = new Asset({ id: 'test-asset', name: undefined, status: 'active' });
      const testName = 'Test Asset Name';

      // Test initial name (undefined)
      assert.strictEqual(asset.get_notion('name').value, undefined, 'Initial name is undefined');

      // Set name
      asset.set_value('name', testName);
      assert.strictEqual(asset.get_notion('name').value, testName, 'Name set and retrieved correctly');

      // Set name with timestamp
      const timestamp = new Date();
      asset.set_value('name', 'New Name', timestamp);
      assert.strictEqual(asset.get_notion('name').value, 'New Name', 'Name set with timestamp correctly');
      assert.strictEqual(asset.get_notion('name').timestamp.getTime(), timestamp.getTime(), 'Timestamp set correctly');

      // Test status
      assert.strictEqual(asset.get_notion('status').value, 'active', 'Initial status is active');
      asset.set_value('status', 'inactive');
      assert.strictEqual(asset.get_notion('status').value, 'inactive', 'Status set and retrieved correctly');
    });

    it('should throw error for non-existent property', () => {
      const asset = new Asset({ id: 'test-asset', name: 'Test Asset' });

      assert.ok(asset.get_notion('status') === undefined, 'Non-existent property returns undefined'); 

      assert.throws(() => {
        asset.set_value('status', 'active');
      }, /Attribute "status" does not exist/, 'Setting non-existent property throws error');
    });

    it('convenience property getter .p()', () => {
      const asset = new Asset({ id: 'test-asset', name: "Test Asset Name", status: 'active' });
      assert.strictEqual(asset.p('name'), "Test Asset Name", 'convenience getter returns correct value');

    });


  });

  describe('set_with_object', () => {
    it('should set all tracked properties from JSON object', () => {
      const asset = new Asset({
        id: 'test-asset',
        name: undefined,
        status: 'active',
        location: undefined
      });

      const testJson = {
        name: 'Test Asset',
        status: 'inactive',
        location: { lat: 40.7128, lon: -74.0060 },
        unknown: 'ignored'
      };

      asset.set_with_object(testJson);

      // Verify name
      assert.strictEqual(asset.get_notion('name').value, 'Test Asset', 'Name set correctly');
      assert.ok(asset.get_notion('name').timestamp instanceof Date, 'Name timestamp is a Date');

      // Verify status
      assert.strictEqual(asset.get_notion('status').value, 'inactive', 'Status set correctly');
      assert.ok(asset.get_notion('status').timestamp instanceof Date, 'Status timestamp is a Date');

      // Verify location
      assert.deepStrictEqual(
        asset.get_notion('location').value,
        { lat: 40.7128, lon: -74.0060 },
        'Location set correctly'
      );
      assert.ok(asset.get_notion('location').timestamp instanceof Date, 'Location timestamp is a Date');

      assert.ok( asset.get_notion('unknown') === undefined, 'Unknown property is ignored' );
    });

    it('should skip missing fields and preserve existing values', () => {
      const asset = new Asset({
        id: 'test-asset',
        name: 'Initial Name',
        status: 'active'
      });

      asset.set_value('name', 'Initial Name');
      asset.set_value('status', 'active');

      const partialJson = {
        status: 'inactive'
      };

      asset.set_with_object(partialJson);

      assert.strictEqual(asset.get_notion('name').value, 'Initial Name', 'Name unchanged');
      assert.strictEqual(asset.get_notion('status').value, 'inactive', 'Status updated');
      assert.ok(asset.get_notion('status').timestamp instanceof Date, 'Status timestamp is a Date');
    });

    it('should throw error for invalid object', () => {
      const asset = new Asset({ id: 'test-asset' });

      assert.throws(() => {
        asset.set_with_object(null);
      }, /Input must be a valid object/, 'Null object throws error');

      assert.throws(() => {
        asset.set_with_object(undefined);
      }, /Input must be a valid object/, 'Undefined object throws error');

      assert.throws(() => {
        asset.set_with_object('not an object');
      }, /Input must be a valid object/, 'Non-object input throws error');
    });
  });

  describe('to_object', () => {
    it('should generate correct JSON representation', () => {
      const asset = new Asset({
        id: 'test-asset',
        name: 'Test Asset',
        status: 'active'
      });

      const timestamp = new Date();
      asset.set_value('name', 'Test Asset', timestamp);
      asset.set_value('status', 'active', timestamp);

      const result = asset.to_object();

      assert.deepStrictEqual(
        result,
        {
          id: 'test-asset',
          name: 'Test Asset',
          name_timestamp: timestamp.toISOString(),
          status: 'active',
          status_timestamp: timestamp.toISOString()
        },
        'JSON representation is correct'
      );
    });

    it('should exclude undefined values', () => {
      const asset = new Asset({
        id: 'test-asset',
        name: undefined,
        status: 'active'
      });

      const timestamp = new Date();
      asset.set_value('status', 'active', timestamp);

      const result = asset.to_object();

      assert.deepStrictEqual(
        result,
        {
          id: 'test-asset',
          status: 'active',
          status_timestamp: timestamp.toISOString()
        },
        'Undefined values are excluded'
      );
    });
  });
});