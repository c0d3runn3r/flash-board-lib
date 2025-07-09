const RowSorter = require('./RowSorter');
const ElementCondition = require('./ElementCondition');

/**
 * @class ConditionRowSorter
 * @description Sorts elements within a segment based on their condition.
 * 
 */
class ConditionRowSorter extends RowSorter {

    /**
     * Creates an instance of ConditionRowSorter.
     * @param {*} obj configuration object for the sorter
     * @param {Board} board - The board this segment belongs to.
     * @throws {Error} If no Board provided, or if it starts feeling grouchy
     */
    constructor(obj = {}, board) {

        super(obj, board);
        // TODO - add configuration options for sorting
    }

    get rows() {

        return 4; // green, unknown, yellow, red
    }

    sort(element) {
        if (!(element instanceof Element)) { throw new Error("ConditionRowSorter.sort() requires an Element instance as the first argument."); }

        // Get the condition of the element
        const condition = element.condition;
        if(!(condition instanceof ElementCondition)) { throw new Error(`Element ${element.id} does not have a valid condition.`); }

        // Determine the row based on the condition
        switch (condition.condition) {
            case 'green':
                return 0;
            case 'unknown':
                return 1;
            case 'yellow':
                return 2;
            case 'red':
                return 3;
            default:
                throw new Error(`Unknown condition '${condition.condition}' for element ${element.id}`);
        }
    }

}

module.exports = ConditionRowSorter;