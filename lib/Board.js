const Asset = require('./Asset');
const Segment = require('./Segment');
const GeoSegment = require('./GeoSegment');
const Element = require('./Element');

class Board {
    #name;
	#assets = [];
	#segments = [];
	#classes = { Asset, Segment, GeoSegment, Element };

	/**
	 * 
	 * @param {object} config the board config 
	 * @param {object} classes any classes that the board will reference
	 */
    constructor(config = {}, classes={}) {

		this.#name = config.name || '';
		this.#assets = [];
		this.#classes = { ...this.#classes, ...classes };

		// Create all segments specified in the config
		for(let s of config.segments || []) {
			if (!s.class) { s.class = 'Segment'; } // Default to Segment if no class is specified
			const SegmentClass = this.#classes[s.class];
			if (!SegmentClass) { throw new Error(`Unable to find segment type '${s.class}', did you forget to pass a custom class to the Board constructor?`); }			
			if (SegmentClass.name != "Segment" && !(SegmentClass.prototype instanceof Segment)) { throw new Error(`Segment class '${s.class}' must be a Segment or inherit from Segment.`); }

			this.#segments.push(new SegmentClass(s, this));
		}

	}

    get name() { return this.#name; }
	get classes() { return this.#classes; }
	get segments() { return this.#segments; }

	/**
	 * Get all assets
	 * Returns a list of all assets managed by this Board.
	 * @returns {Asset[]} An array of Asset instances.
	 */
	get assets() {
		return this.#assets;
	}

	/**
	 * Find
	 * Finds an asset by its ID.
	 * @param {string} id - The ID of the asset to find.
	 * @returns {Asset|null} The asset if found, otherwise null.
	 */
	find_asset_by_id(id) {
		if (typeof id !== 'string' || id.trim() === '') {
			throw new Error("Asset ID must be a non-empty string.");
		}
		const asset = this.#assets.find(b => b.id === id);
		return asset || null;
	}

	/**
	 * Adds an asset to the board.
	 * @param {Asset} asset - The asset to add.
	 */
	add_asset(asset) {
		if (!(asset instanceof Asset)) {
			throw new Error("Only instances of Asset can be added.");
		}

		// Check if the asset already exists
		const existing = this.find_asset_by_id(asset.id);
		if (existing) { throw new Error(`Asset with ID ${asset.id} already exists.`); }
		
		// Add the asset to the list
		if (!asset.id || typeof asset.id !== 'string') { throw new Error("Asset ID must be a non-empty string."); }

		this.#assets.push(asset);
	}

	/**
	 * Removes an asset from the board by its ID.
	 * @param {string} id - The ID of the asset to remove.
	 * @returns {boolean} True if the asset was removed, false if it was not found.
	 */
	remove_asset(id) {

		if (typeof id !== 'string' || id.trim() === '') {
			throw new Error("Asset ID must be a non-empty string.");
		}

		const index = this.#assets.findIndex(asset => asset.id === id);
		if (index === -1) {
			return false; // Asset not found
		}

		this.#assets.splice(index, 1);
		return true; // Asset removed successfully
	}

	/**
	 * Clears all assets from the board.
	 * This method removes all assets from the board, leaving it empty.
	 */
	clear_assets() {
		this.#assets = [];
	}

}

module.exports = Board;