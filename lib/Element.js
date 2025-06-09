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
 * @class Element
 * @description Base class for elements that can hold assets.  An element is a sort of rendering and decision making class.
 * 
 * @emits paired - Emitted when an asset is paired with the element.
 * @emits unpaired - Emitted when an asset is unpaired from the element.
 */
class Element extends EventEmitter {

    #is_static = false; // Static elements persist even if they have no assets
    #asset_class_matcher = "";
    #asset = null; // The asset paired with this element, if any


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
    }

    /**
     * Returns a string representation of the Asset instance.
     * @returns {string} A string representation of the Asset.
     */
    [Symbol.toPrimitive](hint) { if (hint === 'string') { return this.toString(); }}
    toString() { return `${this.constructor.name}{id=${this.id} for=${this._asset_type}}`; }

    get _asset_type() { return (this.#asset)?this.#asset.constructor.name:(this.#asset_class_matcher instanceof RegExp ?  `/${this.#asset_class_matcher.source}/` :  this.#asset_class_matcher); }
    get static() { return this.#is_static; }
    get asset() { return this.#asset; }
    get asset_class_matcher() { return this.#asset_class_matcher; }

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
    }
}

module.exports = Element;