const Queue = require('./Queue.js');

var proto = {
  /**
   * Private method. To validate if doc is in proper format
   * @param {number} doc.time
   * @param {number} doc.close || doc.adjClose
   */
  _validate: function (doc) {
    if (!doc.time || typeof doc.time !== 'number') return false;
    if (!doc[this.dataField] || typeof doc[this.dataField] !== 'number') return false;
    return true;
  },

  _calculate: function () {
    // Directly attach properties on doc
    this.items[this.len - 1][this._getFieldName()] = Queue.roundTo(this._mean(), 2);
  },

  /**
   * Only calculate when items.length == this.len
   * @returns {number}
   */
  _mean: function () {
    if (this.items.length < this.len) return null;

    var sum = this.items.reduce((pre, cur) => {
      pre = (typeof pre === 'object') ? pre.close : pre;
      return pre + cur.close;
    });

    return sum / this.len;
  }
};

function QueueSMA(length, /*optional*/preItems) {
  if (!length) throw new Error('QueueSMA | need to specify "length"');

  // Asign dataField before Queue.apply, or _validate will occur error
  this.dataField = 'close';
  Queue.apply(this, arguments);

  this.taType = 'sma';
}

Queue.extend(QueueSMA, proto);

module.exports = QueueSMA;