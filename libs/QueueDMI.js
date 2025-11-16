const Queue = require('./Queue.js');
const QueueEMA = require('./QueueEMA.js');

const proto = {
  /**
   * @param {Object} stick
   * @param {number} stick.time
   * @param {number} stick.high
   * @param {number} stick.low
   * @param {number} stick.close
   */
  enqueue: function (stick) {
    let itemShifted;

    this.items.push(stick);

    if (this.items.length > this.len) {
      itemShifted = this.items.shift();

      this._calculate();

      return this._shift(itemShifted);
    } else if (this.items.length == this.len) {
      this._calculate();
    }
  },

  _calculate: function () {
    if (this.items.length < 2) return;

    const curStick = this.items[this.len - 1];
    const preStick = this.items[this.len - 2];

    const difH = doc.High - preStick.High;
    const difL = -(doc.Low - preStick.Low);
    const dmPlus = (difH > difL && difH > 0) ? difH : 0;
    const dmMinus = (difH < difL && difH > 0) ? difL : 0;
    const tr = Math.max(doc.High, preStick.close) - Math.min(doc.Low, preStick.close);
    let dmPlus_smooth, dmMinus_smooth, tr_smooth, adx_smooth;
    let diPlus, diMinus, dx;

    this.queueDMPlus.enqueue({ time: curStick.time, close: dmPlus });
    this.queueDMMinus.enqueue({ time: curStick.time, close: dmMinus });
    this.queueTR.enqueue({ time: curStick.time, close: tr });

    dmPlus_smooth = this.queueDMPlus.now();
    dmMinus_smooth = this.queueDMMinus.now();
    tr_smooth = this.queueTR.now();

    if (dmPlus_smooth !== undefined) {
      diPlus = dmPlus_smooth / tr_smooth;
      diMinus = dmMinus_smooth / tr_smooth;
      dx = Math.abs(diPlus - diMinus) / (diPlus + diMinus);
    }

    this.queueADX.enqueue({ time: curStick.time, close: dx });
    adx_smooth = this.queueADX.now();

    curStick[this._getFieldName()] = { diPlus, diMinus, adx: adx_smooth };
  }
};

/**
 * http://nengfang.blogspot.com/2015/03/dmi-excel.html
 * https://zh.wikipedia.org/wiki/%E5%8B%95%E5%90%91%E6%8C%87%E6%95%B8
 * DMI和陰陽線的差別在於DMI把影線和實線的重要性視為相同
 * 
 * TR = Max(最高價，前日收盤價) - Min(最低價，前日收盤價) ：納入前日收盤價的目的是為了計入跳空的區間
 * DI - Directional Indicator
 * DX - Directional Movement Index
 * ADX- Average Directional Movement Index
 */
function QueueDMI(length = 14, /*optional*/preItems) {
  if (!length) throw new Error('QueueDMI | need to specify "length"');

  // Asign dataField before Queue.apply, or _validate will occur error
  this.dataField = ['high', 'low', 'close'];
  Queue.apply(this, arguments);

  this.queueDMPlus = new QueueEMA(length, preItems);
  this.queueDMMinus = new QueueEMA(length, preItems);
  this.queueTR = new QueueEMA(length, preItems);
  this.queueADX = new QueueEMA(length, preItems);

  this.taType = 'dmi';
}

Queue.extend(QueueDMI, proto);
module.exports = QueueDMI;