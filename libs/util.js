// Deep copy object or array
function deepCopy(destination, source, /*optional*/copyIterator = false) {
  if (typeof source === 'boolean') {
    copyIterator = source;
    source = undefined;
  }
  // Pass in an object to be copied and return its copy.
  // (you don't need to pass in an empty object as destination).
  if (!source) {
    source = destination;
    destination = (Array.isArray(source)) ? [] : {};
  }

  for (let property in source) {
    if (typeof source[property] === "object" && source[property] !== null) {
      destination[property] = destination[property] || (Array.isArray(source[property])) ? [] : {};
      deepCopy(destination[property], source[property]);
    } else {
      destination[property] = source[property];
    }
  }

  // Symbol.iterator can't be iterated by for-in loop, so we copy it here
  if (copyIterator == true && source && source[Symbol.iterator]) destination[Symbol.iterator] = source[Symbol.iterator];

  return destination;
}

/**
 * @param {object} child - an object which must have 'prototype' property
 * @param {object} proto1
 * @param {object} proto2
 */
function extend() {
  // Get the list of prototypes			
  const modules = [].slice.call(arguments);
  // Get child
  const child = modules.shift();

  modules.forEach(module => { for (let key in module) child.prototype[key] = module[key]; });
  return child;
}

function roundTo(floatNum, precision) {
  let m = Math.pow(10, precision);
  return Math.round(floatNum * m) / m;
}

/**
 * Get an ordered list of time series from object or array
 * @param {Object | Object[]} dataSet
 * @param {number} dataSet[].time
 * @param {number} dataSet[].close
 */
function _getTimeSeries(dataSet) {
  let arr, sq, output = [];

  if (Array.isArray(dataSet) === true) {
    dataSet.forEach(doc => (doc.close && doc.close !== null) ? output.push(doc.time) : null);
  }
  else {
    arr = Object.keys(dataSet);
    sq = arr.map((d) => parseInt(d));
    sq.forEach(function (time, i) {
      if (i > 0 && time < sq[i - 1]) console.warn('finance-indicators > util._getTimeSeries WARN | The order of dataSet is incorrect.');
      if (dataSet[time].close && dataSet[time].close !== null) output.push(time);
    });
  }

  return output;
}

/**
 * @param {object} dataSet 
 */
function translateObj2Array(dataSet) {
  const addrTime = _getTimeSeries(dataSet);
  const newSet = [];
  addrTime.forEach(time => newSet.push(dataSet[time]));
  return newSet;
}

/**
 * @param {array} dataSet 
 * @param {string} [name] - Specify where the value is if the elements of dataSet is object
 */
function mean_arithmetic(dataSet, name) {
  const qty = dataSet.length;
  const sum = dataSet.reduce((pre, cur) => (name) ? (pre[name] || pre) + cur[name] : pre + cur, 0);
  return sum / qty;
}

// 即KD平滑法
// Set alpha as the first parameter, for currying
function wilderSmoothing(alpha, curValue, preValue) { return alpha * curValue + (1 - alpha) * preValue; }

function uppercase1stLetter(str) { return str.replace(/\b[a-z]/g, (letter) => letter.toUpperCase()); }

module.exports = { deepCopy, extend, roundTo, translateObj2Array, mean_arithmetic, wilderSmoothing, uppercase1stLetter };