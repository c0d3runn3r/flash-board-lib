/**
 * @class Element
 * @description Base class for elements that can hold assets.  An element is a sort of rendering and decision making class.
 */
class Element {

    #is_static = false; // Static elements persist even if they have no assets
    constructor(obj = {}) {
        
        this.#is_static = (obj.static === true)? true : false; 
    }

    get name() {
        return "Element";
    }

    get static() { return this.#is_static; }

    /**
     * Add an asset to the element.
     * This method is intended to be overridden by subclasses to implement specific asset handling logic.
     * @param {*} asset 
     * @returns null|boolean false if the asset is rejected, true if accepted exclusively, or null if accepted non-exclusively.
     */
    add_asset(asset) {
        return false; // Default implementation does not accept any assets
    }
}

module.exports = Element;