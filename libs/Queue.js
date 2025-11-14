const util = require('./util.js');

function Queue(length, /*optional*/preItems) {
  if (preItems && Array.isArray(preItems)) {
    if (preItems.every(doc => this._validate(doc))) {
      // Check the length of preItems
      while (preItems.length > length) { preItems.shift(); }

      this.items = preItems;
    } else console.info('Wrong items:', preItems);
  }

  this.items = this.items || [];
  this.len = length;
}

Queue.prototype = {
  /**
   * @param {object} doc
   * @param {number} doc.time
   * @param {number} doc[this.dataField]
   * @param {boolean} isStickFinished - created by ./trade/TimeStick
   */
  enqueue: function (doc, /*optional*/isStickFinished) {
    let lastItem = this.items[this.items.length - 1];
    let itemShifted;

    if (this._validate(doc) === false) return console.info('Improper data:', doc);

    if (this.items.length == 0 || isStickFinished == undefined || doc.timeTag !== lastItem.timeTag) this.items.push(doc);
    //! Replace the last doc to calculate a temperary result
    else if (isStickFinished !== undefined && doc.timeTag == lastItem.timeTag) this._replaceFinal(doc);
    // 如果額外裝飾此方法，則對資料做預處理
    this._before && this._before();

    if (this.items.length > this.len) {
      itemShifted = this.items.shift();

      this._calculate();

      return this._shift(itemShifted);
    } else if (this.items.length == this.len) {
      this._calculate();
    }
  },

  now: function () {
    const len = this.items.length;
    // macd did not have this.len
    if (this.taType === 'macd') return this.items[len - 1][this._getFieldName()];
    // 資料需達計算所需長度
    return (len == this.len) ? this.items[len - 1][this._getFieldName()] : undefined;
  },

  /**
   * Private method. To validate if doc is in proper format
   */
  _validate: function (doc) {
    if (!this.dataField) throw new Error(`${this.taType} Error | Need to specify this.dataField`);

    if (!doc.time || typeof doc.time !== 'number') return false;
    if (Array.isArray(this.dataField)) {
      return this.dataField.every(fieldName => {
        if (!doc[fieldName] || typeof doc[fieldName] !== 'number') return false;
        return true;
      });
    } else if (!doc[this.dataField] || typeof doc[this.dataField] !== 'number') return false;

    return true;
  },

  _getFieldName: function (fieldName) {
    if (!this.taType) throw new Error('Error | Need to specify this.taType');
    return (fieldName) ? fieldName + this.len : this.taType + this.len;
  },

  _shift: function (itemShifted) {
    var fieldName = this._getFieldName();
    var result = {
      //! 加入_id欄位會導致儲存時不可預期的錯誤
      //_id: itemShifted._id,
      time: itemShifted.time,
    };
    result[fieldName] = itemShifted[fieldName];
    return result;
  },

  _replaceFinal: function (doc) { this.items[this.items.length - 1] = doc; },

  // A template method to calculate results
  _calculate: function () { console.info('Error: Need to implement _calculate()'); },

  /**
   * @description Return those data stored in items
   * @returns {array}
   */
  export: function () { return this.items.map(item => this._shift(item)) },

  //print: function () { }
}

// parent for QueueBollinger
Queue.extend = function (constructor, proto, /*optional*/parent) {
  parent = parent || Queue;

  let template = util.deepCopy(parent.prototype);
  constructor.prototype = template;

  return util.extend(constructor, proto);
}

Queue.roundTo = util.roundTo;
Queue.uppercase1stLetter = util.uppercase1stLetter;
Queue.removeEmpty = function (results, fieldName) {
  var temp = [];
  results.forEach(doc => { if (doc && doc[fieldName]) { temp.push(doc); } });
  return temp;
};

module.exports = Queue;

// For test
//var items = [{ time: 9999, close: 1 }, { time: 9999, close: 2 }, { time: 9999, close: 3 }, { time: 9999, close: 4 }, { time: 9999, close: 5 }, { time: 9999, close: 6 }];
//var tempQueue = new Queue(5, items);