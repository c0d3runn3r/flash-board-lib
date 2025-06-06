const Segment = require('./Segment');
const Asset = require('../lib/Asset');
const gju = require('geojson-utils');

/**
 * Represents a GeoSegment that manages assets within a GeoJSON boundary, extending Segment.
 */
class GeoSegment extends Segment {
  #boundary;

  /**
   * Creates a new GeoSegment instance with a GeoJSON boundary.
   * @param {object} obj - Configuration object.
   * @param {string} [obj.name=''] - The name of the segment.
   * @param {object} obj.boundary - A GeoJSON object defining the bounding area (e.g., Polygon).
   * @throws {Error} If boundary is not a valid GeoJSON object.
   */
  constructor(obj = {}, board = null) {
    super(obj, board);
    if (!obj.boundary || typeof obj.boundary !== 'object' || !obj.boundary.type) {
      throw new Error('Boundary must be a valid GeoJSON object.');
    }
    this.#boundary = obj.boundary;
  }

  /**
   * Gets the GeoJSON boundary of the segment.
   * @returns {object} The GeoJSON boundary object.
   */
  get boundary() {
    return this.#boundary;
  }

  /**
   * Adds an asset to the segment if its position is within the boundary.
   * @param {Asset} asset - The asset to add.
   * @returns {boolean} True if the asset was added (position is valid and within boundary), false otherwise.
   * @throws {Error} If asset is not an instance of Asset or has an invalid ID.
   */
  add_asset(asset) {
    // if (!(asset instanceof Asset)) {
    //   throw new Error('Only instances of Asset can be added.');
    // }
    // if (!asset.id || typeof asset.id !== 'string') {
    //   throw new Error('Asset ID must be a non-empty string.');
    // }

    // Check if the asset already exists
    // const existing = this.find_by_id(asset.id);
    // if (existing) {
    //   throw new Error(`Asset with ID ${asset.id} already exists.`);
    // }

    // Check if asset has a valid position
    const position = asset.position;
    if (!position || typeof position.lat !== 'number' || typeof position.lon !== 'number') {
      return false; // Invalid or missing position
    }

    // Create GeoJSON point for the asset's position
    const point = {
      type: 'Point',
      coordinates: [position.lon, position.lat]
    };

    // Check if the point is within the boundary using geojson-utils
    const is_within_boundary = gju.pointInPolygon(point, this.#boundary);

    if (!is_within_boundary) {
      return false; // Position outside boundary
    }

    // Add the asset to the list
	return super.add_asset(asset);
  }
}

module.exports = GeoSegment;