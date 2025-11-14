const Indicator = require('./libs/proto.js');
const QueueSMA = require('./libs/QueueSMA.js');
const QueueEMA = require('./libs/QueueEMA.js');
const QueueVMA = require('./libs/QueueVMA.js');
//const QueueWMA = require('./libs/QueueWMA.js'); //! 未完成
const QueueRSI = require('./libs/QueueRSI.js');
const QueueKDJ = require('./libs/QueueKDJ.js');
const QueueMACD = require('./libs/QueueMACD.js');
const QueueBollinger = require('./libs/QueueBollinger.js');
const QueueDivergence = require('./libs/QueueDivergence.js');
const QueueMovingOdds = require('./libs/QueueMovingOdds.js'); //! 未使用，待更新
const QueueDMI = require('./libs/QueueDMI.js');
const Track = require('./libs/Track.js');

const Queue = {
  sma: QueueSMA, ema: QueueEMA, vma: QueueVMA,
  rsi: QueueRSI,
  kdj: QueueKDJ,
  macd: QueueMACD,
  bband: QueueBollinger,
  divergence: QueueDivergence,
  dmi: QueueDMI
};

/**
 * Generate track by dataSet once
 * @param {number} timeRange
 * @param {Object|Object[]} dataSet
 * @param {Object} dataSet.db - To use history mode of TrackSeries, database should be traversed totally
 *                              so db should be specified here to ensure the traversing can be completed
 * @param {string} dataSet.timeScale
 * @param {string} dataSet.indexName
 */
function createAll_track(timeRange, dataSet) {
  const track = new Track(timeRange);
  let config, db, timeScale, indexName;

  if (Array.isArray(dataSet)) {
    dataSet.forEach(doc => track.enqueue(doc));
    return track;
  }

  if (typeof dataSet == 'object') {
    config = dataSet;
    db = config.db;
    timeScale = config.timeScale;
    indexName = config.indexName;

    return new Promise((resolve, reject) => {
      db[timeScale].fetchAllStream(indexName, // TODO: 外部依賴，應取消
        (doc) => { track.enqueue(doc) },
        () => { resolve(track) },
        () => { }
      );
    });
  } else return track;
}

/**
 * @param {number} timeRange - 12, 26,...
 * @param {string} typeName  - 'sma', 'ema', 'vma'
 * @param {Object|Object[]} dataSet
 * @param {array}  preItems
 */
function createAll(timeRange, typeName, dataSet, /*optional*/preItems) {
  typeName = typeName.toLowerCase();
  if (typeName == 'track') return createAll_track(timeRange, dataSet);
  if (typeName == 'trend') return createAll_trend(timeRange, dataSet); //? 應取消

  let queue = new Queue[typeName](timeRange, preItems);
  let result = dataSet.map(doc => queue.enqueue(doc));
  // cache未使用
  let cache = queue.exportCache();

  // 取得queue剩餘的計算資料
  result = result.concat(queue.export());
  result = QueueSMA.removeEmpty(result, typeName + timeRange);
  // Notice: ema did not need cache
  return (result.length > 0) ? { data: result, cache: cache } : { data: [] };
}

// Customized extension here
const proto = {
  sma: {}, ema: {}, vma: {},
  kdj: {},
  rsi: {},
  macd: {},
  bband: {},
  dmi: {}
};

// Track因其滯後性，行為有些不同，故不併入factory生成
function factory(type, timeRange, preItems) {
  function Constructor(timeRange, preItems) {
    this.type = type;
    // Should be applied after specify this.type
    Indicator.apply(this, arguments);
  }

  Indicator.extend(Constructor, proto[type]);
  return new Constructor(timeRange, preItems);
}

module.exports = { createAll, factory, Track, Queue };