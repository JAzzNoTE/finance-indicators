const util = require('./util.js');

const Queue = {
  sma: require('./QueueSMA.js'),
  ema: require('./QueueEMA.js'),
  vma: require('./QueueVMA.js'),
  rsi: require('./QueueRSI.js'),
  kdj: require('./QueueKDJ.js'),
  macd: require('./QueueMACD.js'),
  bband: require('./QueueBollinger.js')
};

/**
 * Base constructor for a financial indicator. This acts as a facade, wrapping a specific
 * indicator queue (like SMA, EMA, etc.) based on the `this.type` property.
 * @constructor
 * @param {number} timeRange - The time period or range for the indicator calculation.
 * @param {Array} [preItems] - Optional. An array of pre-existing data items to initialize the indicator queue.
 * @throws {Error} If `this.type` is not specified on the inheriting constructor.
 */
function Indicator(timeRange, preItems) {
  if (!this.type) throw new Error('Indicator | this.type should be specified');
  if (!Object.keys(Queue).includes(this.type)) throw new Error(`finance-indicators ERROR | non-existent indicator type:${this.type}`);
  this.queue = new Queue[this.type.toLowerCase()](timeRange, preItems);
}

// Standard and universal indicator methods
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