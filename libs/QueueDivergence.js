const Queue = require('./Queue.js');

// Modified from ./QueueTrack.js
const proto = {
  /**
   * Private method. To validate if doc is in proper format
   * @param {number} doc.time
   * @param {number} doc.close
   */
  _validate: function (doc) {
    return this.dataField.every(fieldName => (!doc[fieldName] || typeof doc[fieldName] !== 'number') ? false : true);
  },

  _getFieldName: function () { return this.taType; },

  _calculate: function () {
    const maxClose = this.items.reduce((pre, cur) => Math.max(pre, cur['close']), 0);
    const minClose = this.items.reduce((pre, cur) => Math.min((typeof pre === 'number') ? pre : pre['close'], cur['close']));
    const lastClose = this.items[this.len - 1].close;
    const result = {};

    // 如果是極值→清除之前queue內的所有記錄
    if (maxClose == lastClose) {
      result.maxClose = maxClose;
      this._replacePast('maxClose');
    }
    else if (minClose == lastClose) {
      result.minClose = minClose;
      this._replacePast('minClose');
    }

    if (Object.keys(result).length !== 0) this.items[this.len - 1][this._getFieldName()] = result;
  },

  _shift: function (itemShifted) {
    let fieldName = this._getFieldName();
    let direction;

    if (itemShifted[fieldName]) {
      if (itemShifted[fieldName].maxClose) direction = 'bear';
      else if (itemShifted[fieldName].minClose) direction = 'bull';

      if (direction) itemShifted.direction = direction;
    }

    return itemShifted;
  },

  _replacePast: function (name) {
    let fieldName = this._getFieldName();
    // NOTICE: Keep the last value, so i < this.len - 1, not i <= this.len - 1
    for (let i = 0; i < this.len - 1; i += 1) {
      if (this.items[i]?.[fieldName]) {
        if (this.items[i][fieldName][name]) this.items[i][fieldName]['past_' + name] = this.items[i][fieldName][name];
        delete this.items[i][fieldName][name];
      }
    }
  }
};

function QueueDivergence(length, /*optional*/preItems) {
  // Asign dataField before Queue.apply, or _validate will occur error
  this.dataField = ['time', 'close'];
  Queue.apply(this, arguments);

  this.taType = 'divergence';
}

Queue.extend(QueueDivergence, proto);
QueueDivergence.removeEmpty = Queue.removeEmpty;

module.exports = QueueDivergence;