const util = require('./util.js');
const Queue = require('./Queue.js');

const roundTo = util.roundTo;
const mean_arithmetic = util.mean_arithmetic;

// We use simple mean(unweighted) as first valve
// see https://fxcodebase.com/wiki/index.php/%E6%8C%87%E6%95%B8%E5%8A%A0%E6%AC%8A%E7%A7%BB%E5%8B%95%E5%B9%B3%E5%9D%87%E7%B7%9A_(EMA)
function calcuFirstEMA(queue, timeRange) {
  let len = queue.length;
  let stick;

  if (len == timeRange) {
    stick = queue[len - 1];
    stick['ema' + timeRange] = Queue.roundTo(mean_arithmetic(queue, 'close'), 2);
    return stick;
  } else if (len > timeRange) {
    throw new Error(`calcuFirstEMA | The length of queue ${len} is bigger than timeRange ${timeRange}`);
  }
}

// General EMA formula
// http://fxcodebase.com/wiki/index.php/%E6%8C%87%E6%95%B8%E5%8A%A0%E6%AC%8A%E7%A7%BB%E5%8B%95%E5%B9%B3%E5%9D%87%E7%B7%9A_(EMA)
// http://alptbag.blogspot.com/2014/02/maema.html
function emaSmoothing(price, preEMA, interval) {
  var alpha = 2 / (interval + 1);
  return preEMA + alpha * (price - preEMA);
}

const proto = {
  _calculate: function () {
    const fieldName = this._getFieldName();
    const len = this.items.length;
    let preEMA, curStick;

    if (len < this.len) return;

    preEMA = this.items[len - 2][fieldName];
    if (!preEMA) {
      return this.items[len - 1] = calcuFirstEMA(this.items, this.len);
    } else {
      curStick = this.items[len - 1];
      // Directly attach properties on doc
      curStick[fieldName] = Queue.roundTo(emaSmoothing(curStick.close, preEMA, this.len), 2);
    }
  }
};

/**
 * Notice: 在N=12與26時，涵蓋權數分別等於0.886與0.875，故通常EMA取12、26兩個數字
 * @param {number} timeRange - 12, 26,...
 * @param {array}  preItems
 */
function QueueEMA(length, /*optional*/preItems) {
  if (!length) throw new Error('QueueEMA | need to specify "length"');

  // Asign dataField before Queue.apply, or _validate will occur error
  this.dataField = 'close';
  Queue.apply(this, arguments);

  this.taType = 'ema';
}

Queue.extend(QueueEMA, proto);

// For RSI, MACD
QueueEMA.calcuFirstEMA = calcuFirstEMA;
QueueEMA.emaSmoothing = emaSmoothing;

module.exports = QueueEMA;