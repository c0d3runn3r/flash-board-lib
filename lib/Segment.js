const Asset = require('../lib/Asset');
const Element = require('../lib/Element');


class Segment {
    #name;
    #assets = [];
	#board;
	#elements = [];

	/**
	 * 
	 * @param {*} obj configuration object for the segment
	 * @param {string} obj.name - The name of the segment.
	 * @param {Board} board - The board this segment belongs to.
	 * @throws {Error} If no Board provided, or if an element class is specified in the config that does not exist, or if the class does not inherit from Element.
	 */
    constructor(obj = {}, board) {
		
		if (!board || !(board.constructor.name == "Board")) { throw new Error("A valid Board instance must be provided to the Segment constructor."); }

        this.#name = obj.name || 'Segment';
		this.#board = board;

		// Iterate all elements specified in the config and create them
		for (let e of obj.elements || []) { this.#elements.push(this.#board.element_factory(e.class , { static: true})); }				
    }

    get name() {
        return this.#name;
    }

	/**
	 * Find
	 * Finds an asset by its ID.
	 * @param {string} id - The ID of the asset to find.
	 * @returns {Asset|null} The asset if found, otherwise null.
	 */
	find_asset(id) {
		if (typeof id !== 'string' || id.trim() === '') {
			throw new Error("Asset ID must be a non-empty string.");
		}
		const asset = this.#assets.find(b => b.id === id);
		return asset || null;
	}

	/**
	 * Adds an asset to the array, pairing it with an existing static element or creating a new element if necessary
	 * 
	 * Default behavior is to accept any asset.  If you subclass this, you can be pickier - just call super.add_asset(asset) if you accept it.
	 * 
	 * @param {Asset} asset - The asset to add.
     * @throws {Error} If the asset is not an instance of Asset, if the ID is invalid, or if an asset with the same ID already exists.
     * @returns {boolean} True if the asset was added successfully.
	 */
	add_asset(asset) {

		if (!(asset instanceof Asset)) { throw new Error("Only instances of Asset can be added"); }

		// Check if the asset already exists, then add it
		const existing = this.find_asset(asset.id);
		if (existing) { throw new Error(`Asset with ID ${asset.id} already exists.`); }
		this.#assets.push(asset);

		// Iterate all static elements and see if they can pair with this asset
		for (const element of this.#elements.filter(e => e.static)) { if (element.pair(asset)) {  return true; } }

		// No luck!  Create a new element for this asset
		let element = this.#board.element_factory(asset);
		element.pair(asset);
		this._add_element(element);

        return true;
	}

	/** 
	 * Removes an asset by its ID.
	 * 
	 * @param {string} id - The ID of the asset to remove.
	 * @returns {boolean} True if the asset was removed, false if it was not found.
	 */
	remove_asset(id) {

		// Validate the ID
		if (typeof id !== 'string' || id.trim() === '') { throw new Error("Asset ID must be a non-empty string."); }

		// Find the asset
		const index = this.#assets.findIndex(a => a.id === id);
		if (index === -1) { return false; } // Not found

		// Remove the asset from the array
		const asset = this.#assets.splice(index, 1)[0];

		// Remove the asset from any associated elements
		for (const element of this.#elements) { 
			if (element.asset === asset) { 
				element.unpair(); 
				this._prune_elements();
				break;
			 } }

		return true; // Asset removed successfully
	}

	/**
	 * Prunes non-static elements that no longer have an associated asset.
	 * 
	 * @private
	 */
	_prune_elements() {
	
		this.#elements = this.#elements.filter(e => e.asset !== null || e.static );

		// TODO ... do we need to do anything so that our display can be re rendered?
	}

	/**
	 * Adds an element
	 * 
	 * @param {Element} element - The element to add.
	 * @throws {Error} If the element is not an instance of Element or if it already exists in the segment.
	 * @private
	 */
	_add_element(element) {
		if (!(element instanceof Element)) { throw new Error("Only instances of Element can be added"); }

		// Check if this same element object already exists
		if (this.#elements.includes(element)) { throw new Error("Element already exists in the segment"); }
		this.#elements.push(element);
	}
		

    get assets() { return [...this.#assets]; }
	get elements() { return [...this.#elements]; }
}

module.exports = Segment;