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
    if (!doc.volume || typeof doc.volume !== 'number') return false;
    return true;
  },

  _calculate: function () {
    let priceMultipleVolume = this.items.reduce((pre, cur) => { return pre + cur[this.dataField] * cur.volume }, 0);
    let sumVolume = this.items.reduce((pre, cur) => { return pre + cur.volume }, 0);
    // Directly attach properties on doc
    this.items[this.len - 1][this._getFieldName()] = Queue.roundTo(priceMultipleVolume / sumVolume, 2);
  }
};

function QueueVMA(length, /*optional*/preItems) {
  if (!length) throw new Error('QueueVMA | need to specify "length"');

  // Asign dataField before Queue.apply, or _validate will occur error
  this.dataField = 'close';
  Queue.apply(this, arguments);

  this.taType = 'vma';
}

Queue.extend(QueueVMA, proto);
QueueVMA.extend = Queue.extend;
QueueVMA.removeEmpty = Queue.removeEmpty;
QueueVMA.roundTo = Queue.roundTo;

module.exports = QueueVMA;