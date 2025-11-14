const util = require('./util.js');
const Queue = require('./Queue.js');
const QueueEMA = require('./QueueEMA.js');

const roundTo = util.roundTo;

const proto = {
  /**
   * @param {object} doc
   * @param {number} doc.time
   * @param {number} doc.close
   */
  enqueue: function (doc) {
    if (this._validate(doc) === false) return console.log(this.taType, '| Improper data:', doc);

    this.queueFast.enqueue(doc);
    this.queueSlow.enqueue(doc);
    this.items.push(doc);

    // NOTICE: only need one item in queue
    if (this.items.length > 1) {
      itemShifted = this.items.shift();
      this._calculate();
      return this._shift(itemShifted);
    } else this._calculate();
  },

  //! NOTICE
  //_getFieldName: function () { return 'macd' + this.param.fast + this.param.slow + this.param.dem; },
  _getFieldName: function () { return 'macd'; },

  _calculate: function () {
    const curDoc = this.items[this.items.length - 1];
    const fieldName = this._getFieldName();
    const fast = this.queueFast.now();
    const slow = this.queueSlow.now();
    let dif, dem;

    if (!fast || !slow) return;

    // Calculate DIF
    dif = fast - slow;
    // Generate DEM
    this.queueDEM.enqueue({ time: curDoc.time, close: dif });
    dem = this.queueDEM.now();
    // Calculate D-M
    if (dem) {
      curDoc[fieldName] = {
        dif: roundTo(dif, 2),
        dem: roundTo(dem, 2),
        dMinusM: roundTo(dif - dem, 2)
      };
    }
  }
};

// https://zh.wikipedia.org/wiki/MACD
// https://zh.wikipedia.org/zh-tw/指数平滑移动平均线
// https://wiki.mbalib.com/zh-tw/平滑异同移动平均线
/**
 * @param {number} param.fast
 * @param {number} param.slow
 * @param {number} param.dem
 * @param {array}  preItems 
 */
//! Can not use Queue.apply(this, arguments) because typeof param is object, not number
function QueueMACD(param, /*optional*/preItems) {
  if (!param || !param.fast || !param.slow || !param.dem) throw new Error('QueueMACD | need to specify "param"');
  // Copied from Queue.js
  if (preItems && Array.isArray(preItems)) {
    if (preItems.every(doc => this._validate(doc))) {
      // Check the length of preItems
      while (preItems.length > 1) { preItems.shift(); }

      this.items = preItems;
    } else console.log('Wrong items:', preItems);
  }

  // Asign dataField before Queue.apply, or _validate will occur error
  this.dataField = 'close';
  this.param = param;

  this.items = this.items || [];

  //! 這裡的preItems要調整為QueueEMA需要'ema' + length的格式，暫不修正
  this.queueFast = new QueueEMA(param.fast, preItems);
  this.queueSlow = new QueueEMA(param.slow, preItems);
  this.queueDEM = new QueueEMA(param.dem, preItems);

  // Can not borrow from Queue.js because of different parameters
  //Queue.apply(this, arguments);

  this.taType = 'macd';
}

Queue.extend(QueueMACD, proto);
//QueueMACD.extend = Queue.extend;
//QueueMACD.removeEmpty = Queue.removeEmpty;
//QueueMACD.roundTo = Queue.roundTo;

module.exports = QueueMACD;