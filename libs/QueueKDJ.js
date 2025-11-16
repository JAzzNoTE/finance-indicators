const Queue = require('./Queue.js');

//! usually be 1/3, can be adjusted
const ALPHA = 1 / 3;

var proto = {
  // Calculate RSV
  _calculate: function () {
    const high = this.items.reduce((pre, cur) => Math.max(pre, cur['high']), 0);
    const low = this.items.reduce((pre, cur) => Math.min((typeof pre === 'number') ? pre : pre['low'], cur['low']));
    const close = this.items[this.len - 1]['close'];
    const preStick = this.items[this.len - 2];
    const fieldName = this._getFieldName();

    const RSV = ((close - low) / (high - low)) * 100;
    let K, D, J, KmD;

    if (preStick?.[fieldName]) {
      K = ALPHA * RSV + (1 - ALPHA) * preStick[fieldName].K;
      D = ALPHA * K + (1 - ALPHA) * preStick[fieldName].D;
    } else {
      // Calcu the first value
      K = ALPHA * RSV + (1 - ALPHA) * 50;
      D = ALPHA * K + (1 - ALPHA) * 50;
    }
    J = 3 * D - 2 * K;
    KmD = K - D;

    this.items[this.len - 1][fieldName] = {
      K: K,
      D: D,
      J: J,
      KmD: KmD
    };
  }
};

/**
 * The main formula of KDJ
 * See: https://zh.wikipedia.org/wiki/%E9%9A%8F%E6%9C%BA%E6%8C%87%E6%A0%87
 *      https://wiki.mbalib.com/zh-tw/随机指标
 * @param {number} timeRange - parameters of KDJ, usually be 9
 */
function QueueKDJ(timeRange, /*optional*/preItems) {
  // Asign dataField before Queue.apply, or _validate will occur error
  this.dataField = ['close', 'low', 'high'];
  Queue.apply(this, arguments);

  this.taType = 'kdj';
}

Queue.extend(QueueKDJ, proto);
QueueKDJ.removeEmpty = Queue.removeEmpty;

module.exports = QueueKDJ;