const util = require('./util.js');

/**
 * @description A constructor for a queue with a fixed length.
 * @constructor
 * @param {number} length The maximum size of the queue.
 * @param {Array} [preItems] Optional. An array of items to pre-populate the queue. 
 *                           The array will be truncated from the beginning if its length exceeds the specified queue `length`.
 */
function Queue(length, preItems) {
  if (preItems && Array.isArray(preItems)) {
    if (preItems.every(doc => this._validate(doc))) {
      // Check the length of preItems
      while (preItems.length > length) { preItems.shift(); }

      this.items = preItems;
    } else console.info('Wrong items:', preItems);
  }

  this.items = this.items || [];
  this.len = length;
}

Queue.prototype = {
  /**
   * @description Replaces the last item in the queue with a new one. 
   *              This is typically used to update the most recent data point when it is not yet final.
   * @private
   * @param {Object} stick The new data object to replace the last item in the queue.
   * @returns {void}
   */
  _replaceFinal: function (stick) { this.items[this.items.length - 1] = stick; },

  /**
   * @description Adds a new data point (stick) to the queue. If the queue is full, it removes the oldest item.
   * @param {Object} stick The data object to add to the queue.
   * @param {number} stick.time The timestamp of the data point.
   * @param {number} stick[this.dataField] The value of the data point corresponding to the dataField.
   * @param {boolean} [isStickFinished] - A flag from ./trade/StickChannel.mjs indicating if the stick is final for its time period.
   *                                      If false, the last item in the queue might be replaced instead of adding a new one.
   * @returns {Object|undefined} The oldest item that was removed from the queue (if the queue was full), or undefined otherwise.
   */
  enqueue: function (stick, isStickFinished) {
    let lastItem = this.items[this.items.length - 1];
    let itemShifted;

    if (this._validate(stick) === false) return console.info('Improper data:', stick);

    if (this.items.length == 0 || isStickFinished == undefined || stick.timeTag !== lastItem.timeTag) this.items.push(stick);
    //! Replace the last doc to calculate a temperary result
    else if (isStickFinished !== undefined && stick.timeTag == lastItem.timeTag) this._replaceFinal(stick);
    // 如果額外裝飾此方法，則對資料做預處理
    this._before && this._before();

    if (this.items.length > this.len) {
      itemShifted = this.items.shift();

      this._calculate();

      return this._shift(itemShifted);
    } else if (this.items.length == this.len) {
      this._calculate();
    }
  },

  /**
   * @description Retrieves the most recent calculated technical indicator value from the queue.
   *              For most indicators, this will only return a value when the queue is full (i.e., has enough data for a valid calculation).
   *              The MACD indicator is a special case and may return a value even if the queue is not full.
   * @returns {number|undefined} The calculated value of the latest item in the queue, or `undefined` if the queue has not yet reached the required length for calculation.
   */
  now: function () {
    const len = this.items.length;
    // macd did not have this.len
    if (this.taType === 'macd') return this.items[len - 1][this._getFieldName()];
    // The data must reach the required length for calculation.
    return (len == this.len) ? this.items[len - 1][this._getFieldName()] : undefined;
  },

  /**
   * Private method. To validate if doc is in proper format
   */
  _validate: function (stick) {
    if (!this.dataField) throw new Error(`${this.taType} Error | Need to specify this.dataField`);

    if (!stick.time || typeof stick.time !== 'number') return false;
    if (Array.isArray(this.dataField)) {
      return this.dataField.every(fieldName => {
        if (!stick[fieldName] || typeof stick[fieldName] !== 'number') return false;
        return true;
      });
    } else if (!stick[this.dataField] || typeof stick[this.dataField] !== 'number') return false;

    return true;
  },

  _getFieldName: function (fieldName) {
    if (!this.taType) throw new Error('Error | Need to specify this.taType');
    return (fieldName) ? fieldName + this.len : this.taType + this.len;
  },

  /**
   * @description Creates a simplified result object from the item that was removed from the queue.
   * @private
   * @param {Object} itemShifted The data object that was removed from the front of the queue.
   * @returns {Object} A new object containing the `time` and the calculated technical indicator value for the shifted item.
   */
  _shift: function (itemShifted) {
    var fieldName = this._getFieldName();
    var result = {
      //! Adding the '_id' field might cause unexpected error during storage.
      //_id: itemShifted._id,
      time: itemShifted.time,
    };
    result[fieldName] = itemShifted[fieldName];
    return result;
  },

  /**
   * @description A placeholder method for calculating technical indicator values. 
   *              This method is intended to be overridden by subclasses that implement specific indicator calculations.
   *              It is typically called when the queue is full or when an item is shifted.
   * @private
   * @returns {void}
   */
  _calculate: function () { console.info('Error: Need to implement _calculate()'); },

  /**
   * @description Return those data stored in items
   * @returns {array}
   */
  export: function () { return this.items.map(item => this._shift(item)) }
}

// parent for QueueBollinger
Queue.extend = function (constructor, proto, /*optional*/parent) {
  parent = parent || Queue;

  let template = util.deepCopy(parent.prototype);
  constructor.prototype = template;

  return util.extend(constructor, proto);
}

Queue.roundTo = util.roundTo;
Queue.uppercase1stLetter = util.uppercase1stLetter;
Queue.removeEmpty = function (results, fieldName) {
  var temp = [];
  results.forEach(doc => { if (doc && doc[fieldName]) { temp.push(doc); } });
  return temp;
};

module.exports = Queue;
