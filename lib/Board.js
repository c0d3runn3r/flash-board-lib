const Asset = require('./Asset');
const Segment = require('./Segment');
const GeoSegment = require('./GeoSegment');
const Element = require('./Element');
const EventEmitter = require('node:events').EventEmitter;

class Board extends EventEmitter {
	#name;
	#segments = [];
	#classes = { Asset, Segment, GeoSegment, Element };
	#asset_to_element = new Map(); // Maps asset IDs to elements
	#min_event_seconds; // minimum seconds between events
	
	/**
	* 
	* @param {object} config the board config 
	* @param {number} [config.min_event_seconds=5] minumum seconds between events
	* @param {object} [config.segments] an array of segment configurations
	* @param {object} classes any classes that the board will reference
	*/
	constructor(config = {}, classes={}) {
		
		super();
		
		this.#name = config.name || '';
		this.#min_event_seconds = config.min_event_seconds || 5; 
		this.#classes = { ...this.#classes, ...classes };
		
		// If the config has a list of asset -> config mappings, store them in the asset_to_element map
		if(config.asset_to_element) {
			if (Array.isArray(config.asset_to_element)) {
				for (let map of config.asset_to_element) {
					if(typeof map.asset == 'string' && typeof map.element == 'string') {
						this.#asset_to_element.set(map.asset, map.element);
					} else {
						throw new Error("Asset to element mapping must be an array of objects with 'asset' and 'element' properties as strings.");
					}
				}
			} else { 
				throw new Error("Asset to element mapping must be an array of objects with 'asset' and 'element' properties as strings.");
			}
		}		
		
		// Create all segments specified in the config
		for(let s of config.segments || []) {
			if (!s.class) { s.class = 'Segment'; } // Default to Segment if no class is specified
			const SegmentClass = this.#classes[s.class];
			if (!SegmentClass) { throw new Error(`Unable to find segment type '${s.class}', did you forget to pass a custom class to the Board constructor?`); }			
			if (SegmentClass.name != "Segment" && !(SegmentClass.prototype instanceof Segment)) { throw new Error(`Segment class '${s.class}' must be a Segment or inherit from Segment.`); }
			
			this._add_segment(new SegmentClass(s, this)); 
		}
		
	}
	
	get name() { return this.#name; }
	get classes() { return this.#classes; }
	get segments() { return this.#segments; }
	
	/**
	* Change event aggregator
	* 
	* This is called when a segment has changed.
	* It is also called on a n second timer.
	* It will emit a change event when something has changed but no more frequently than the configured minimum seconds.
	* @private
	*/
	#last_event_time = 0; // Timestamp of the last change event
	#changes = [];
	_change_event_aggregator(event) {

		// If we are being passed an event, this is a change event and we should store it
		if (event) { this.#changes.push(event); }
		
		// Is it time to emit a change event?
		const now = Date.now();
		if (now - this.#last_event_time < this.#min_event_seconds * 1000) { return; }
		this.#last_event_time = now; // Update the last event time
		
		// If we have no changes, do not emit
		if (this.#changes.length === 0) { return; }
		
		// Collapse changes by removing any duplicates
		const unique_changes = new Map();
		for (let change of this.#changes) {
			const key = `${change.segment_index}-${change.element_index}`; // Create a unique key for each change
			if (!unique_changes.has(key)) {
				unique_changes.set(key, change);
			}
		}
		this.#changes = Array.from(unique_changes.values()); // Convert back to array
		
		// Get checksums for each segment that has changed
		const segment_checksums = Array.from(new Set(this.#changes.map(change => change.segment_index))).map(index => ({
			segment_index: index,
			checksum: this.#segments[index].checksum
		}));
		
		this.emit('change', {
			board: this,
			changes: this.#changes,
			segment_checksums: segment_checksums
		});		
		
		this.#changes = []; // Reset changes after emitting
	}
	
	/**
	* Element factory
	* 
	* This is configurable by passing a map of asset IDs to element classes in the board config.
	* If called with an asset, the returned element is guaranteed to be willing to .pair() with the asset.
	* 
	* @param {Asset|string} [target="Element"] - The asset to create an element for, or the string name of the Element constructor 
	* @param {object} [params={}] - Additional parameters to pass to the element constructor.
	* @returns {Element} An instance of Element or a subclass
	* @throws {Error} If an element is specified in the config that is configured to not accept the asset, or if a class is missing.
	*/
	element_factory(target="Element", params={}) {

		// Find the name of the element class we should construct
		let classname;
		if (target instanceof Asset) { 
			
			classname = this.#asset_to_element.get(target.constructor.name) || "Element"; 
			
		} else if (typeof target === 'string') { 
			
			classname = target; 
			
		} else { 
			
			throw new Error("Target must be an Asset instance or a string representing the element class name."); 
		}
		
		// Get the actual class
		const ElementClass = this.#classes[classname];
		if (!ElementClass) { throw new Error(`Unable to find class '${classname}', did you forget to pass a custom class to the Board constructor?`); }
		
		// Construct the element and verify it is able to pair with the asset
		const element = new ElementClass(params);
		if(target instanceof Asset && !element.pair(target, true)) { throw new Error(`Element class '${classname}' is not configured to accept asset of type '${((typeof target)=='string')?target:target.constructor.name}'.`); }
		
		return element;
	}
	
	/**
	* Adds an asset to the board by finding a Segment that will take it.
	* @param {Asset} asset - The asset to add.
	*/
	add_asset(asset) {
		if (!(asset instanceof Asset)) { throw new Error("Only instances of Asset can be added."); }
		
		// Find a segment that can take this asset
		for(let segment of this.#segments) { if (segment.add_asset(asset)) { return true; } }
		
		throw new Error(`No segment was willing to take asset with ID '${asset.id}'.  Consider creating a default segment?`);
	}
	
	/** 
	* Add a segment to the board.
	* 
	* Segments should be created by config at construction time! 
	* This should only be called by the Board constructor
	* 
	* @private
	* @param {Segment} segment - The segment to add.
	* @throws {Error} If the segment is not an instance of Segment 
	*/
	_add_segment(segment) {
		
		// Make sure segment is a Segment and that it doesn't already exist
		if (!(segment instanceof Segment)) { throw new Error("Only instances of Segment can be added."); }
		if (this.#segments.some(s => s.name === segment.name)) { throw new Error(`Segment with name '${segment.name}' already exists.`); }

		this.#segments.push(segment); // Add the segment to the board

		// Pipe change events from the segment to the board
		let segment_index = this.#segments.length - 1; 
		segment.on('change', (event) => { this._change_event_aggregator({ ...event, segment_index }); });
	}
	
	/**
	* Find an asset
	* 
	* @param {string} id - The ID of the asset to find.
	* @returns {Array|null} an array containing [segment, asset] if found, otherwise null.
	*/
	find_asset(id) {
		
		if (typeof id !== 'string' || id.trim() === '') { throw new Error("Asset ID must be a non-empty string."); }
		
		for (let segment of this.#segments) {
			const asset = segment.find_asset(id);
			if (asset) {
				return [segment, asset]; // Return both the owning segment and the asset
			}
		}	
		
		return null; // No segment found with the asset ID
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
		
		let found =this.find_asset(id);
		if (!found) { return false; } // Asset not found
		
		let [segment, _] = found;
		if (!segment.remove_asset(id)) { throw new Error(`Asset with ID '${id}' could not be removed from segment.`); }
		
		return true; // Asset removed successfully
	}
	
	
}

module.exports = Board;