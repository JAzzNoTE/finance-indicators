const Queue = require('./Queue.js');
const QueueSMA = require('./QueueSMA.js');

// Times of Standard Deviation
const N = 2;

const proto = {
  /**
   * @param {object} doc
   * @param {number} doc.time
   * @param {number} doc.close
   */
  enqueue: function (doc) {
    let itemShifted;

    if (this._validate(doc) === false) return console.log('Improper data:', doc);

    this.queue.enqueue(doc);
    this.items.push(doc);

    if (this.items.length > this.len) {
      itemShifted = this.items.shift();

      this._calculate();

      return this._shift(itemShifted);
    } else if (this.items.length == this.len) {
      this._calculate();
    }
  },

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
  // TODO: 完成signal後就不用客製fieldName
  _getFieldName: function () { return this.taType; },

  _calculate: function () {
    const curDoc = this.items[this.items.length - 1];
    let fieldName = this._getFieldName();
    let sma = this.queue.now();

    // Calculate Standard Deviation
    let sumSquare = this.items.reduce((preV, doc) => Math.pow(doc.close - sma, 2) + preV, 0);
    let sd = Math.sqrt(sumSquare / this.len);
    // Calculate band
    let high = sma + N * sd;
    let low = sma - N * sd;

    curDoc[fieldName] = {
      sd: Queue.roundTo(sd, 2),
      high: Queue.roundTo(high, 2),
      low: Queue.roundTo(low, 2),
      // %b = (收盤價−布林帶下軌值) ÷ (布林帶上軌值−布林帶下軌值)
      percentageB: (curDoc.close - low) / (high - low),
      bandwidth: (high - low) / sma
    };
  },

  _shift: function (itemShifted) {
    let fieldName = this._getFieldName();
    let result = {
      //! 加入_id欄位會導致儲存時不可預期的錯誤
      //_id: itemShifted._id,
      time: itemShifted.time,
      close: itemShifted.close
    };
    result[fieldName] = itemShifted[fieldName];
    return result;
  }
};

// https://zh.wikipedia.org/wiki/標準差
// https://zh.wikipedia.org/wiki/布林带
function QueueBollinger(length = 20, /*optional*/preItems) {
  // Asign dataField before Queue.apply, or _validate will occur error
  this.dataField = 'close';

  // DEBUG
  //Queue.apply(this, arguments);
  Queue.apply(this, [length, preItems]);

  this.queue = new QueueSMA(length, preItems);

  this.taType = 'bband';
}

Queue.extend(QueueBollinger, proto);

module.exports = QueueBollinger;