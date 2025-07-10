const Notion = require('./Notion');
const objectpath = require('object-path');

/**
 * Represents an Asset with attributes stored as Notions and a unique ID.
 */
class Asset {
  #notions;
  #id;

  /**
   * Creates a new Asset instance with initialized attributes as Notions.
   * @param {object} [properties={}] - An object containing property names and their default values, including required 'id'.
   */
  constructor(properties = {}) {
    if (!properties.id || typeof properties.id !== 'string') {
      throw new Error("Asset ID must be a non-empty string.");
    }

    this.#id = properties.id;
    this.#notions = new Map(
      Object.entries(properties)
        .filter(([name]) => name !== 'id')
        .map(([name, value]) => [name, new Notion(name, value)])
    );
  }

  /**
   * Adds a Notion to the Asset's notions map.
   * @param {Notion} n - The Notion instance to add.
   * @throws {Error} If the Notion is not an instance of Notion.
   */
  add_notion(n) {

    if (!(n instanceof Notion)) { throw new Error("Notion must be an instance of Notion."); }
    this.#notions.set(n.name, n);
  }

  /**
   * Returns a string representation of the Asset instance.
   * @returns {string} A string representation of the Asset.
   */
  [Symbol.toPrimitive](hint) { if (hint === 'string') { return this.toString(); }}
  toString() { return `${this.constructor.name}{id=${this.id}}`; }

  /**
   * Gets the position of the asset as a coordinate triplet.
   * @returns {{lat: number, lon: number, alt: number}|null} An object containing latitude, longitude, and altitude in the WGS84 coordinate system (degrees for lat/lon, meters for altitude) with valid values, or null in the base class to indicate no position.
   */
  get position() {
    return null;
  }
  
  /**
   * Gets the unique identifier of the asset.
   * @returns {string} The asset's ID.
   */
  get id() {
    return this.#id;
  }

  /**
   * Sets the value of a notion with an optional timestamp.
   * @param {string} name - The name of the attribute.
   * @param {*} value - The value to set.
   * @param {dayjs|Date|string} [timestamp] - The timestamp for the update.
   * @throws {Error} If the attribute name does not exist.
   */
  set_value(name, value, timestamp) {
    const notion = this.#notions.get(name);
    if (!notion) {
      throw new Error(`Attribute "${name}" does not exist.`);
    }
    if (timestamp === undefined) {
      notion.value = value;
    } else {
      notion.set_value(value, timestamp);
    }
  }

  /**
   * Gets the Notion instance for a given attribute name.
   * @param {string} name - The name of the attribute.
   * @returns {Notion} The corresponding Notion instance.

   */
  get_notion(name) {
    const notion = this.#notions.get(name);
    // if (!notion) {
    //   throw new Error(`Attribute "${name}" does not exist.`);
    // }
    return notion;
  }

  /**
   * Convenience method to get the value of a notion property by its name 
   * @param {string} name - The name of the attribute.
   * @returns {*} The value of the attribute.
   */
  p(name) { return this.get_notion(name)?.value; }

  /**
   * Sets multiple asset properties from a JSON object.
   * @param {object} object the JSON object containing asset properties.
   * @param {boolean} [reverse_deep_search = false] if true, will use notion names as keys into the object, otherwise will use the first level keys as notion names.
   * @throws {Error} If the object is not a valid object.
   */
  set_with_object(object, reverse_deep_search = false) {

    if (!object || typeof object !== 'object') {
      throw new Error("Input must be a valid object.");
    }

    if(reverse_deep_search) {

      // Reverse deep search: use notion names as keys into the object
      for (const [name, notion] of this.#notions) {
        if (objectpath.has(object, name)) {

          this.set_value(name, objectpath.get(object, name)); // Use current time for timestamp
        }
        // Silently ignore properties not in the object
      }
      return;
    }

    for (const [name, value] of Object.entries(object)) {
      if (this.#notions.has(name)) {
        this.set_value(name, value, undefined); // Use current time for timestamp
      }
      // Silently ignore properties not in notions map
    }
  }

  /**
   * Generates an object representation of the asset's data.
   * @returns {object} An object representing the asset's properties.
   */
  toObject() {
    const result = { id: this.#id, notions: [] };

    for (const [name, notion] of this.#notions) {
      if (notion.value !== undefined) {
        result.notions.push({
          name: name,
          value: notion.value,
          timestamp: notion.timestamp ? notion.timestamp.toISOString() : undefined,
        });
      }
    }

    return result;
  }

  
}

module.exports = Asset;