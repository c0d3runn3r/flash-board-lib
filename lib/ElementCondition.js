
const VALID_CONDITIONS = ['green', 'yellow', 'red', 'unknown'];

/**
 * Class representing an element condition.
 */
class ElementCondition {

	#condition;
	#trend;

	
	constructor(condition = "green", trend = "unknown") {

		// Validate condition and trend
		if(!ElementCondition.validate_condition(condition)) { throw new Error(`Invalid condition '${condition}' provided. Valid conditions are: ${VALID_CONDITIONS.join(', ')}`); }	
		if(!ElementCondition.validate_condition(trend)) { throw new Error(`Invalid trend '${trend}' provided. Valid conditions are: ${VALID_CONDITIONS.join(', ')}`); }

		this.#condition = condition;
		this.#trend = trend;
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
		if(!ElementCondition.validate_condition(value)) { throw new Error(`Invalid condition '${value}' provided. Valid conditions are: ${VALID_CONDITIONS.join(', ')}`); }
		this.#condition = value;
	}
	get trend() { return this.#trend; }
	set trend(value) {
		if(!ElementCondition.validate_condition(value)) { throw new Error(`Invalid trend '${value}' provided. Valid conditions are: ${VALID_CONDITIONS.join(', ')}`); }
		this.#trend = value;
	}


}

module.exports = ElementCondition;