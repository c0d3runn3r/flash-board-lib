const assert = require('assert');
const fs = require('fs');
const path = require('path');
const GeoSegment = require('../lib/GeoSegment');
const Asset = require('../lib/Asset');
const Element = require('../lib/Element');

/**
 * Represents an Asset with a position notion, extending Asset.
 */
class PositionedAsset extends Asset {
  /**
   * Gets the position of the asset from the position notion.
   * @returns {{lat: number, lon: number, alt: number}|null} An object containing latitude, longitude, and altitude in the WGS84 coordinate system (degrees for lat/lon, meters for altitude) with valid values from the position notion, or null if position is undefined or invalid.
   */
  get position() {
    const position = this.get_notion('position').value;
    if (position && typeof position === 'object' && 'lat' in position && 'lon' in position && 'alt' in position) {
      return {
        lat: position.lat,
        lon: position.lon,
        alt: position.alt
      };
    }
    return null;
  }
}

describe('GeoSegment', () => {

  let boardMock;
  class Board { element_factory(_,params) { return new Element(params); } }

  beforeEach(() => {
    boardMock = new Board();
  });


  let boundaries;
  let oregon_hq_boundary;
  let cpd_boundary;

  before(() => {
    // Read and parse the boundaries.geojson file
    const boundaries_path = path.join(__dirname, "data", 'boundaries.geojson');
    boundaries = JSON.parse(fs.readFileSync(boundaries_path, 'utf8'));

    // Extract Oregon HQ and CPD boundaries
    oregon_hq_boundary = boundaries.features.find(f => f.properties.name === 'Oregon HQ').geometry;
    cpd_boundary = boundaries.features.find(f => f.properties.name === 'CPD').geometry;
  });

  describe('constructor', () => {
    it('should create GeoSegment with valid boundary', () => {
      const segment = new GeoSegment({ name: 'Oregon HQ', boundary: oregon_hq_boundary }, boardMock);
      assert.strictEqual(segment.name, 'Oregon HQ', 'Name set correctly');
      assert.strictEqual(segment.boundary, oregon_hq_boundary, 'Boundary set correctly');
    });

    it('should throw error for invalid boundary', () => {
      assert.throws(() => {
        new GeoSegment({ name: 'Invalid', boundary: null }, boardMock);
      }, /Boundary must be a valid GeoJSON object/, 'Null boundary throws error');

      assert.throws(() => {
        new GeoSegment({ name: 'Invalid', boundary: {} }, boardMock);
      }, /Boundary must be a valid GeoJSON object/, 'Invalid boundary throws error');
    });
  });

  describe('add_asset', () => {
    let oregon_hq_segment;
    let cpd_segment;
    let bracer;
    let smokey;

    beforeEach(() => {
      // Create GeoSegments for Oregon HQ and CPD
      oregon_hq_segment = new GeoSegment({ name: 'Oregon HQ', boundary: oregon_hq_boundary }, boardMock);
      cpd_segment = new GeoSegment({ name: 'CPD', boundary: cpd_boundary }, boardMock);

      // Create assets with specified positions
      bracer = new PositionedAsset({
        id: 'bracer',
        position: { lat: 44.543605166666666, lon: -123.359397, alt: 86.9 }
      });
      smokey = new PositionedAsset({
        id: 'smokey',
        position: { lat: 44.5427685, lon: -123.37945066666667, alt: 96.1 }
      });
    });

    it('should add bracer to Oregon HQ segment', () => {
      const added = oregon_hq_segment.add_asset(bracer);
      assert.strictEqual(added, true, 'Bracer added to Oregon HQ');
      assert.strictEqual(oregon_hq_segment.assets.length, 1, 'One asset in Oregon HQ');
      assert.strictEqual(oregon_hq_segment.find_asset('bracer'), bracer, 'Bracer found in Oregon HQ');
    });

    it('should add bracer to CPD segment', () => {
      const added = cpd_segment.add_asset(bracer);
      assert.strictEqual(added, true, 'Bracer added to CPD');
      assert.strictEqual(cpd_segment.assets.length, 1, 'One asset in CPD');
      assert.strictEqual(cpd_segment.find_asset('bracer'), bracer, 'Bracer found in CPD');
    });

    it('should add smokey to CPD segment', () => {
      const added = cpd_segment.add_asset(smokey);
      assert.strictEqual(added, true, 'Smokey added to CPD');
      assert.strictEqual(cpd_segment.assets.length, 1, 'One asset in CPD');
      assert.strictEqual(cpd_segment.find_asset('smokey'), smokey, 'Smokey found in CPD');
    });

    it('should not add smokey to Oregon HQ segment', () => {
      const added = oregon_hq_segment.add_asset(smokey);
      assert.strictEqual(added, false, 'Smokey not added to Oregon HQ');
      assert.strictEqual(oregon_hq_segment.assets.length, 0, 'No assets in Oregon HQ');
      assert.strictEqual(oregon_hq_segment.find_asset('smokey'), null, 'Smokey not found in Oregon HQ');
    });

    it('should not add asset with invalid position', () => {
      const invalid_asset = new Asset({ id: 'invalid', last_seen: null });
      const added = oregon_hq_segment.add_asset(invalid_asset);
      assert.strictEqual(added, false, 'Asset with invalid position not added');
      assert.strictEqual(oregon_hq_segment.assets.length, 0, 'No assets in Oregon HQ');
    });
  });
});