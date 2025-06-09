const EventEmitter = require('node:events').EventEmitter;

/**
 * @event paired
 * @description Emitted when an asset is paired with the element.
 * @param {Element} element - The element that was paired.
 * @param {Asset} asset - The asset that was paired with the element.
 */

/**
 * @event unpaired
 * @description Emitted when an asset is unpaired from the element.
 * @param {Element} element - The element that was unpaired.
 * @param {Asset} asset - The asset that was unpaired from the element.
 */

/**
 * @event change
 * @description Emitted when the element's render changes.  This is automatically emitted as needed based on .summary changing; it relies on .dirty() being called by subclasses when necessary.
 */


/**
 * @class Element
 * @description Base class for elements that can hold assets.  An element is a sort of rendering and decision making class.
 * 
 * @emits paired - Emitted when an asset is paired with the element.
 * @emits unpaired - Emitted when an asset is unpaired from the element.
 * @emits change - Emitted when the element's render changes.  This is automatically emitted as needed based on .summary changing; it relies on .dirty() being called by subclasses when necessary.
 */
class Element extends EventEmitter {

    #is_static = false; // Static elements persist even if they have no assets
    #asset_class_matcher = "";
    #asset = null; // The asset paired with this element, if any
    #cached_summary;


    /**
     * Constructor for Element
     * @param {Object} [obj={}] - Configuration object for the element.
     * @param {boolean} [obj.static=false] - Whether the element is static (persists without an asset).
     * @param {string|Regex} [obj.asset_class_matcher=/.+/] - A string or regex to match the asset class this element can handle.
     */
    constructor(obj = {}) {
        
        super(); 
        this.#is_static = (obj.static === true)? true : false; 
        this.#asset_class_matcher = obj.asset_class_matcher || /.+/; // Default to matching any asset class

        // Update the summary once the element is constructed
        process.nextTick(() => {
            this.#cached_summary = this.summary;
        });
    }

    /**
     * Returns a string representation of the Asset instance.
     * @returns {string} A string representation of the Asset.
     */
    [Symbol.toPrimitive](hint) { if (hint === 'string') { return this.toString(); }}
    toString() { return `${this.constructor.name}{${this.static?'static ':''}for=${this._asset_type} asset=${this.#asset===null?'none':this.#asset.toString()}}`; }

    get _asset_type() { return (this.#asset)?this.#asset.constructor.name:(this.#asset_class_matcher instanceof RegExp ?  `/${this.#asset_class_matcher.source}/` :  this.#asset_class_matcher); }
    get static() { return this.#is_static; }
    get asset() { return this.#asset; }
    get asset_class_matcher() { return this.#asset_class_matcher; }

    /**
     * Render the element
     * 
     * @param {string} [format='text'] - The format to render the element in, defaults to 'text'.
     */
    render(format='text') {

        switch(format) {
            case 'text':
                return this.toString();
            default:
                throw new Error(`Unknown format '${format}' for rendering element.`);
        }
    }

    /**
     * Provide a string summary of this element for caching purposes.
     * @returns {string} A string summary of the element.
     */
    get summary() {

        // Override me! 
        return this.toString();
    }

    /**
     * The element may be 'dirty', meaning the render may have changed.
     * 
     * Call this method any time any time something changes that may affect the render of this element, e.g. when an asset's internal state changes.
     * This is automatically called on pairing and unpairing assets, but you may need to call it manually in other cases.
     * 
     * @emits change when the summary (hence render) changes.
     */
    dirty() {

        if( this.#cached_summary !== this.summary) {
            this.#cached_summary = this.summary;
            this.emit('change', this);
        }
    }


    /**
     * Pair with an asset
     * 
     * @param {*} asset 
     * @return {boolean} true if the asset was accepted, false otherwise.
     */
    pair(asset, test=false) {

        // Can't pair if we are already paired
        if(this.#asset) return false; 

        // Can't pair if the asset is not the right type
        if(!asset.constructor.name.match(this.#asset_class_matcher)) return false; 

        if(!test) this.#asset = asset;
        this.emit('paired', this, asset); 
        this.dirty();
        return true;
    }

    /**
     * Unpair the asset from this element
     * 
     * @throws {Error} If there is no asset to unpair.
     */
    unpair() {
        if (!this.#asset) {
            throw new Error("No asset to unpair.");
        }
        let asset = this.#asset;
        this.#asset = null;
        this.emit('unpaired', this, asset);
        this.dirty();
    }
}

module.exports = Element;