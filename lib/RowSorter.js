const Element = require('../lib/Element');


/**
 * @class Sorter
 * @description Sorts elments within a segment
 */
class RowSorter {
	#board;

	/**
	 * Creates an instance of RowSorter.
	 * @param {*} obj configuration object for the sorter
	 * @param {Board} board - The board this segment belongs to.
	 * @throws {Error} If no Board provided, or if it starts feeling grouchy
	 */
    constructor(obj = {}, board) {

		if (!board || !(board.constructor.name == "Board")) { throw new Error("A valid Board instance must be provided to the Sorter constructor."); }

        this.#board = board;

    }

	/**
	 * Return the total number of rows 
	 * 
	 * @return {number} rows - the total number of rows
	 */
	get rows() {

		return 1;
	}

	/**
	 * Sorts the given element to a row
	 * 
	 * @param {Element} element the element to sort
	 * @returns {number} the zero-based index of the row the element was sorted to
	 */
	sort(element) {

		if (!(element instanceof Element)) { throw new Error("ElementSorter.sort() requires an Element instance as the first argument."); }
		
		return 0;
	}

}

module.exports = RowSorter;