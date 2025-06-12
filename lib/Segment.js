const Asset = require('../lib/Asset');
const Element = require('../lib/Element');
const EventEmitter = require('node:events').EventEmitter;

/**
 * @event change
 * @description Emitted when an element's render changes
 * @param {Object} data - The data associated with the change event.
 * @param {Segment} data.segment - The segment that changed.
 * @param {Element} data.element - The element that changed, or null if the element was removed
 * @param {string} data.summary - A summary of the element's current state (from the element's .summary property)
 * @param {number} data.index - The index of the element that changed, or -1 if the change was not related to a specific element.
 */

/**
 * @class Segment
 * @description Represents a segment of a board, containing elements and assets.
 * @emits change - Emitted when an element's render changes
 */
class Segment extends EventEmitter{
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

		super();
		
		if (!board || !(board.constructor.name == "Board")) { throw new Error("A valid Board instance must be provided to the Segment constructor."); }

        this.#name = obj.name || 'Segment';
		this.#board = board;

		// Add all static elements specified in the config using _add_element so that events are set up correctly
		for(let e of obj.elements || []) { this._add_element(this.#board.element_factory(e.class, { static: true })); }
    }

    get name() {
        return this.#name;
    }

	/**
	 * Get the checksum of the elements in this segment.
	 * 
	 * This is a hash of the summaries of all elements, which can be used to detect changes in the segment.
	 * @returns {number} A checksum representing the current state of the segment.
	 */
	get checksum() {
		
		let arr=this.elements.map(e => e?.summary||null);
		let hash = 0;
		for (let i = 0; i < arr.length; i++) {
			const item = arr[i];
			if (item === null) {
				hash = (hash * 31 + 0) & 0xffffffff; // Use 0 for null
			} else {
				for (let j = 0; j < item.length; j++) {
					hash = (hash * 31 + item.charCodeAt(j)) & 0xffffffff; // Process each character
				}
			}
			hash = hash ^ (i + 1); // Incorporate array index to differentiate order
		}
		return hash >>> 0; // Ensure unsigned 32-bit integer
		
	}

	/**
	 * Render the segment
	 * 
	 * @param {string} [format='text'] - The format to render the segment in, defaults to 'text'.
	 * @returns {*} The rendered segment in the specified format.
	 */
	render(format = 'text') {

		let s;
		switch(format) {

			case 'text':
			s=`Segment: ${this.name}\n`;
			for(let n in this.#elements) {
				s += `Element ${n}: ${this.#elements[n].render('text')}\n`;
			}
			return s;
			case 'object':
				return {
					name: this.name,
					elements: this.#elements.map(e => e.render('object'))
				};
			default:
				throw new Error(`Unknown format '${format}' for rendering segment.`);
		}

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
		for (const element of this.#elements.filter(e => e?.static)) { if (element.pair(asset)) {  return true; } }

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
			
			if(element === null) continue; // Skip null elements

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

		// Iterate all elements.  Any that are not static and have no asset should be replaced with null, and we should remove any listeners on them.
		for (let i = 0; i < this.#elements.length; i++) {
			const element = this.#elements[i];

			if( element === null) continue; // Skip null elements

			if (!element.static && !element.asset) {
				element.removeAllListeners('change'); // Remove listeners to prevent memory leaks
				this.#elements[i] = null; // Replace with null

				// Emit an event that the segment has changed
				this.emit('change', {
					segment: this,
					element: null,
					summary: "",
					element_index: i
				});
			}
		}

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

		// Find the index of the first null element, if any, and replace it
		let index = this.#elements.findIndex(e => e === null);
		if (index !== -1) {
			this.#elements[index] = element;
		} else {

			// No null elements, so push the new element to the end of the array
			this.#elements.push(element);
			index = this.#elements.length - 1; 
		}

		// Emit an event that the segment has changed
		this.emit('change', {
			segment: this,
			element: element,
			summary: element.summary,
			element_index: index
		});

		// Emit a change for any future element changes
		element.on('change', (e) => this.emit('change', {
			segment: this,
			element: e,
			summary: e.summary,
			element_index: index
		}));
	
	}		

    get assets() { return [...this.#assets]; }
	get elements() { return [...this.#elements]; }
}

module.exports = Segment;