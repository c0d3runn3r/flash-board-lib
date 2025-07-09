
const VALID_CONDITIONS = ['green', 'yellow', 'red', 'unknown'];

/**
 * Class representing an element condition.
 */
class ElementCondition {

	#condition;
	#trend;
	#message;


	constructor(condition = "green", trend = "unknown", message = "") {

		// Validate condition and trend
		if (!ElementCondition.validate_condition(condition)) { throw new Error(`Invalid condition '${condition}' provided. Valid conditions are: ${VALID_CONDITIONS.join(', ')}`); }
		if (!ElementCondition.validate_condition(trend)) { throw new Error(`Invalid trend '${trend}' provided. Valid conditions are: ${VALID_CONDITIONS.join(', ')}`); }
		if (typeof message !== 'string') { throw new Error(`Invalid message '${message}' provided. Message must be a string.`); }

		this.#condition = condition;
		this.#trend = trend;
		this.#message = message;
	}

	/**
	 * Compare two ElementCondition instances
	 * @param {ElementCondition} a - The first ElementCondition instance.
	 * @param {ElementCondition} b - The second ElementCondition instance.
	 * @returns {number} A negative number if a < b, zero if a == b, and a positive number if a > b.
	 * @static
	 */
	static compare(a, b) {
		const order = ['unknown', 'green', 'yellow', 'red'];

		const cond_diff = order.indexOf(a.condition) - order.indexOf(b.condition);
		if (cond_diff !== 0) return cond_diff;

		return order.indexOf(a.trend) - order.indexOf(b.trend);
	}


	/**
	 * Validate a condition
	 * 
	 * This method checks if the provided condition is a valid string
	 * @param {string} condition the condition to validate
	 * @returns {boolean} true if the condition is valid, false otherwise
	 * @static
	 */
	static validate_condition(condition) {

		// Make sure it is a string
		if (typeof condition !== 'string') { return false }

		// Validate
		if (!VALID_CONDITIONS.includes(condition)) { return false }

		return true;
	}

	get condition() { return this.#condition; }
	set condition(value) {
		if (!ElementCondition.validate_condition(value)) { throw new Error(`Invalid condition '${value}' provided. Valid conditions are: ${VALID_CONDITIONS.join(', ')}`); }
		this.#condition = value;
	}
	get trend() { return this.#trend; }
	set trend(value) {
		if (!ElementCondition.validate_condition(value)) { throw new Error(`Invalid trend '${value}' provided. Valid conditions are: ${VALID_CONDITIONS.join(', ')}`); }
		this.#trend = value;
	}
	get message() { return this.#message; }
	set message(value) {
		if (typeof value !== 'string') { throw new Error(`Invalid message '${value}' provided. Message must be a string.`); }
		this.#message = value;
	}

	/**
	 * Convert the condition to a string representation.
	 * @returns {string} A string representation of the condition.
	 */
	toString() {
		return `${this.condition}${this.trend !== 'unknown' ? ` (${this.trend})` : ''}${this.message ? `: ${this.message}` : ''}`;
	}

	toObject() {
		return {
			type: this.constructor.name,
			condition: this.condition,
			trend: this.trend,
			message: this.message
		};
	}

}

module.exports = ElementCondition;