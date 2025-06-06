const Asset = require('../lib/Asset');
const Element = require('../lib/Element');


class Segment {
    #name;
    #assets = [];
	#board;
	#elements = [];

    constructor(obj = {}, board) {
        this.#name = obj.name || '';
		this.#board = board;


		// Iterate all elements specified in the config and create them
		for (let e of obj.elements || []) {
			if (!e.class) { e.class = 'Element'; } // Default to Element if no class is specified
			const ElementClass = this.#board.classes[e.class];
			if (!ElementClass) { throw new Error(`Unable to find element type '${e.class}', did you forget to pass a custom class to the Board constructor?`); }
			if (ElementClass.name != "Element" && !(ElementClass.prototype instanceof Element)) { throw new Error(`Element class '${e.class}' must be an Element or inherit from Element.`); }
			this.#elements.push(new ElementClass({...e, static: true })); // Since this element is being created by the config, it will be static
		}

				
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
	find_by_id(id) {
		if (typeof id !== 'string' || id.trim() === '') {
			throw new Error("Asset ID must be a non-empty string.");
		}
		const asset = this.#assets.find(b => b.id === id);
		return asset || null;
	}

	/**
	 * Adds an asset to the array
	 * @param {Asset} asset - The asset to add.
     * @throws {Error} If the asset is not an instance of Asset, if the ID is invalid, or if an asset with the same ID already exists.
     * @returns {boolean} True if the asset was added successfully.
	 */
	add_asset(asset) {

		if (!(asset instanceof Asset)) {
			throw new Error("Only instances of Asset can be added");
		}

		// Check if the asset already exists
		const existing = this.find_by_id(asset.id);
		if (existing) { throw new Error(`Asset with ID ${asset.id} already exists.`); }
		
		this.#assets.push(asset);
        return true;
	}

    get assets() { return [...this.#assets]; }
	get elements() { return [...this.#elements]; }
}

module.exports = Segment;