const Queue = require('./Queue.js');
const QueueEMA = require('./QueueEMA.js');

const proto = {
  /**
   * @param {Object} stick
   * @param {number} stick.time
   * @param {number} stick.close
   */
  enqueue: function (stick) {
    if (this._validate(stick) === false) return console.log(this.taType, '| Improper data:', stick);

    this.queueFast.enqueue(stick);
    this.queueSlow.enqueue(stick);
    this.items.push(stick);

    // NOTICE: only need one item in queue
    if (this.items.length > 1) {
      itemShifted = this.items.shift();
      this._calculate();
      return this._shift(itemShifted);
    } else this._calculate();
  },

  //! NOTICE
  //_getFieldName: function () { return 'macd' + this.config.fast + this.config.slow + this.config.dem; },
  _getFieldName: function () { return 'macd'; },

  _calculate: function () {
    const curStick = this.items[this.items.length - 1];
    const fieldName = this._getFieldName();
    const fast = this.queueFast.now();
    const slow = this.queueSlow.now();
    let dif, dem;

    if (!fast || !slow) return;

    // Calculate DIF
    dif = fast - slow;
    // Generate DEM
    this.queueDEM.enqueue({ time: curStick.time, close: dif });
    dem = this.queueDEM.now();
    // Calculate D-M
    if (dem) {
      curStick[fieldName] = {
        dif: Queue.roundTo(dif, 4),
        dem: Queue.roundTo(dem, 4),
        dMinusM: Queue.roundTo(dif - dem, 4)
      };
    }
  }
};

// https://zh.wikipedia.org/wiki/MACD
// https://zh.wikipedia.org/zh-tw/指数平滑移动平均线
// https://wiki.mbalib.com/zh-tw/平滑异同移动平均线
/**
 * @param {Object} config
 * @param {number} config.fast
 * @param {number} config.slow
 * @param {number} config.dem
 * @param {array}  [preItems ]
 */
//! Can not use Queue.apply(this, arguments) because typeof config is object, not number
function QueueMACD(config, preItems) {
  if (!config || !config.fast || !config.slow || !config.dem) throw new Error('QueueMACD | configuration of "fast", "slow", and "dem" are required');
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
  this.config = config;

  this.items = this.items || [];

  //! 這裡的preItems要調整為QueueEMA需要'ema' + length的格式，暫不修正
  this.queueFast = new QueueEMA(config.fast, preItems);
  this.queueSlow = new QueueEMA(config.slow, preItems);
  this.queueDEM = new QueueEMA(config.dem, preItems);

  // Can not borrow from Queue.js because of different parameters
  //Queue.apply(this, arguments);

  this.taType = 'macd';
}

Queue.extend(QueueMACD, proto);

module.exports = QueueMACD;