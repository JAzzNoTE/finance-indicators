const util = require('./util.js');

const Queue = require('./Queue.js');
const QueueEMA = require('./QueueEMA.js');

const roundTo = util.roundTo;
const mean_arithmetic = util.mean_arithmetic;
const wilderSmoothing = util.wilderSmoothing;
const emaSmoothing = QueueEMA.emaSmoothing;

function calcuUD(items) {
  const len = items.length;
  const preStick = items[len - 2];
  const preClose = preStick.close || preStick.adjClose;
  const dif = items[len - 1].close - preClose;
  let u, d;

  // For easy reading, do not change to ?: statement
  if (dif >= 0) {
    u = dif;
    d = 0;
  } else {
    u = 0;
    d = -dif;
  }

  return [u, d];
}

// Notice: u與d需要第2個交易日得出
//         uEMA, dEMA, rsi的第一個數據需要timeRange+1個交易日才可得出
function getFirstRSI(fieldName, dataSetSub) {
  let uWMA = mean_arithmetic(dataSetSub, fieldName + '_u');
  let dWMA = mean_arithmetic(dataSetSub, fieldName + '_d');

  return {
    uWMA: uWMA,
    dWMA: dWMA,
    rsi: calcuRSI(uWMA, dWMA)
  };
}

function calcuRSI(uWMA, dWMA) { return roundTo(uWMA * 100 / (uWMA + dWMA), 2); }

const proto = {
  /**
   * https://www.moneydj.com/KMDJ/wiki/wikiViewer.aspx?keyid=1342fb37-760e-48b0-9f27-65674f6344c9
   * https://zh.wikipedia.org/wiki/相對強弱指數
   * ! 經過驗證，採ema平滑法指標會變得較敏感，但影響績效不顯著，故仍使用威爾德平滑法
   *
   * Process to calcu RSI:
   * Ⅰ. doc.close → u, d
   * Ⅱ. u, d → uWMA, dWMA (the first uWMA and dWMA needs the quantity 'timeRange' of u and d)
   * Ⅲ. uWMA, dWMA → rsi
   *
   * @param {Object} stick
   * @param {number} stick.time
   * @param {number} stick.close
   * ! isStickFinished was created by ./trade/StickChannel, it might pass doc1m when timeScale == '5m', '30m', ...
   * @param {boolean} [isStickFinished] - created by ./trade/StickChannel
   */
  enqueue: function (stick, isStickFinished) {
    let lastItem = this.items[this.items.length - 1];
    if (this._validate(stick) === false) return console.log(this.taType, '| Improper data:', stick);

    if (this.items.length == 0) {
      if (isStickFinished !== undefined && isStickFinished == false) return;

      this.queueFirstRSI.push(stick);
      return this._calcuFirstRSI();
    }

    //! Replace the last doc to calculate a temperary result
    if (isStickFinished !== undefined && stick.timeTag == lastItem.timeTag) this._replaceFinal(stick);
    // NOTICE: this.items would be empty until first RSI appears
    else this.items.push(stick);

    // NOTICE: only need two items in queue
    if (this.items.length > 2) {
      itemShifted = this.items.shift();
      this._calculate();
      return this._shift(itemShifted);
    } else if (this.items.length == 2) {
      this._calculate();
    }
  },

  now: function () { return (this.items[1]) ? this.items[1][this._getFieldName()] : undefined; },

  _calcuFirstRSI: function () {
    const len = this.queueFirstRSI.length;
    const curStick = this.queueFirstRSI[len - 1];
    const fieldName = this._getFieldName();
    let u, d, dataSetSub;

    if (len <= 1) return;

    [u, d] = calcuUD(this.queueFirstRSI);
    curStick[fieldName + '_u'] = u;
    curStick[fieldName + '_d'] = d;

    if (len >= this.len + 1) {
      // Remove first doc because there is no 'u' & 'd' existed
      this.queueFirstRSI.shift();

      dataSetSub = this.queueFirstRSI.splice(len - this.len, this.len);
      curStick[fieldName] = getFirstRSI(fieldName, dataSetSub);

      this.items.push(curStick);

      delete this.queueFirstRSI;
    }
  },

  /**
   * Private method. To validate if stick is in proper format
   * @param {Object} stick
   * @param {number} stick.time
   * @param {number} stick.close || stick.adjClose
   */
  _validate: function (stick) {
    if (!stick.time || typeof stick.time !== 'number') return false;
    if (!stick[this.dataField] || typeof stick[this.dataField] !== 'number') return false;
    return true;
  },

  _calculate: function () {
    const fieldName = this._getFieldName();
    const [u, d] = calcuUD(this.items);

    let preUWMA = this.items[0][fieldName].uWMA;
    let preDWMA = this.items[0][fieldName].dWMA;
    let curDoc = this.items[1];
    let uWMA = wilderSmoothing(this.alpha, u, preUWMA);
    let dWMA = wilderSmoothing(this.alpha, d, preDWMA);
    //! 最後決議維持採用威爾德平滑法
    //let uWMA = emaSmoothing(curDoc.u, preUWMA, timeRange);
    //let dWMA = emaSmoothing(curDoc.d, preDWMA, timeRange);

    curDoc[fieldName] = {
      uWMA: uWMA,
      dWMA: dWMA,
      rsi: calcuRSI(uWMA, dWMA)
    };
  }
};

/**
 * 
 * @param {number} timeRange - parameters of RSI, usually be 14
 * @param {array} preItems 
 */
function QueueRSI(timeRange, /*optional*/preItems) {
  // Asign dataField before Queue.apply, or _validate will occur error
  this.dataField = 'close';

  Queue.apply(this, arguments);

  this.alpha = 1 / timeRange;
  this.queueFirstRSI = [];

  // Overwrite this.items specified in Queue.apply
  this.items = [];

  if (preItems) {
    let lastCache = preItems[preItems.length - 1];

    if (lastCache.uWMA && lastCache.dWMA) {
      this.items = [lastCache];
    } else {
      this.queueFirstRSI = preItems;
      this.calcuFirstRSI();
    }
  }

  this.taType = 'rsi';
}

Queue.extend(QueueRSI, proto);

module.exports = QueueRSI;