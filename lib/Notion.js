EventEmitter = require('events').EventEmitter;
const dayjs = require('dayjs');

/**
 * Emitted when the value changes.
 * @event Notion#changed
 * @type {object}
 * @property {string} property - The name of the changed property.
 * @property {*} old_value - The previous value of the property.
 * @property {*} new_value - The new value of the property.
 */

/**
 * Represents a Notion, which is a key-value pair with a timestamp.
 * @fires Notion#changed
 */
class Notion extends EventEmitter {

    #name;
    #value;
    #timestamp;
    #default_value;

    /**
     * Creates a new Notion instance.
     * @param {string} name - The name of the notion.
     * @param {*} default_value - The default value of the notion.
     */
    constructor(name, default_value) {

        super();
        this.#name = name;
        this.#default_value = default_value;
    }

    /**
     * Returns the name of the notion.
     * @returns {string} The name of the notion.
     */
    get name() {
        return this.#name;
    }

    /**
     * Returns the value of the notion.
     * If the value is not set, it returns the default value.
     * @returns {*} The value of the notion or the default value if not set.
     */
    get value() {
        return this.#value ?? this.#default_value;
    }

    /**
     * Returns the timestamp of the last update.
     * @returns {Date} The timestamp of the last update, or undefined if not set.
     */
    get timestamp() {
        return this.#timestamp;// instanceof Date ? this.#timestamp : new Date(this.#timestamp);
    }

    /**
     * Convenience setter for set_value()
     * @param {*} value - The value to set for the notion.
     */
    set value(value) { this.set_value(value, new Date()); }

    /**
     * Sets the value and timestamp of the notion.
     * @param {*} value 
     * @param {dayjs|Date|string} timestamp 
     */
    set_value(value, timestamp) {
        let date;
        if (typeof timestamp === 'string') {
            const parsed = dayjs(timestamp);
            if (!parsed.isValid()) {
                throw new Error('Invalid timestamp string.');
            }
            date = parsed.toDate();
        } else if (timestamp?.$d instanceof Date) { // Check for dayjs-like object
            date = timestamp.toDate();
        } else if (timestamp instanceof Date) {
            date = timestamp;
        } else {
            throw new Error('Invalid timestamp type. Must be dayjs, Date, or string.');
        }

        let old_value = this.#value; // Store the old value for event emission
        this.#value = value;
        this.#timestamp = date;

        this.emit('changed', {
            property: this.#name,
            old_value: old_value,
            new_value: this.#value
        });

    }
}

module.exports = Notion;