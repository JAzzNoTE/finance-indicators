const util = require('./util.js');
const QueueSMA = require('./QueueSMA.js');
const QueueEMA = require('./QueueEMA.js');
const QueueVMA = require('./QueueVMA.js');
const QueueRSI = require('./QueueRSI.js');
const QueueKDJ = require('./QueueKDJ.js');
const QueueMACD = require('./QueueMACD.js');
const QueueBollinger = require('./QueueBollinger.js');

const selector = {
  sma: QueueSMA,
  ema: QueueEMA,
  vma: QueueVMA,
  rsi: QueueRSI,
  kdj: QueueKDJ,
  macd: QueueMACD,
  bband: QueueBollinger
};
// TODO: 寫註解: 將queue組合為指標的屬性，並包裏一層facade方法
function Indicator(timeRange, preItems) {
  if (!this.type) throw new Error('Indicator | this.type should be specified');
  this.queue = new selector[this.type.toLowerCase()](timeRange, preItems);
}

Indicator.prototype = {
  enqueue: function (doc, isStickFinished) { return this.queue.enqueue(doc, isStickFinished) },
  now: function () { return this.queue.now() },
  export: function () { return this.queue.export() },
  getFieldName: function () { return this.queue._getFieldName() }
};

Indicator.extend = function (constructor, proto) {
  constructor.prototype = Indicator.prototype;
  return util.extend(constructor, proto);
}

module.exports = Indicator;