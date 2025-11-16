const Queue = require('./Queue.js');

var proto = {
  /**
   * Private method. To validate if doc is in proper format
   * @param {number} doc.time
   * @param {number} doc.dif
   * @param {string} doc.buyTrend
   */
  _validate: function (doc) {
    let status = doc.status;

    if (!status.time || typeof status.time !== 'number') return false;
    return this.dataField.every(fieldName => {
      return (status[fieldName] !== undefined);
    });
  },

  _calculate: function () {
    let item = this.items[this.len - 1];
    let itemPre = this.items[this.len - 2];
    let timeWin = this.items.reduce((pre, cur) => { return pre + ((cur.status.win > 0) ? cur.status.win : 0); }, 0);
    item.oddsMoving = {
      time: item.status.time,
      timeWin: timeWin,
      winRate: timeWin / this.len
    };

    if (this.items.length === this.len && !this.items[0].oddsMoving) {
      this.items.forEach((doc, i, arr) => {
        doc.oddsMoving = doc.oddsMoving || {};
        if (i == 0) {
          if (doc.status.win > 0) {
            doc.timeWinContinuous = 1;
            doc.timeLoseContinuous = 0;
            doc.oddsMoving.timeWinContinuous = 1;
          } else {
            doc.timeLoseContinuous = 1;
            doc.timeWinContinuous = 0;
            doc.oddsMoving.timeLoseContinuous = 1;
          }
        } else {
          countContimuous(doc, arr[i - 1]);
        }
      });
    }

    countContimuous(item, itemPre);
  },

  _shift: function (itemShifted) {
    if (!itemShifted.oddsMoving) return;

    let result = itemShifted.oddsMoving;
    result.time = itemShifted.status.time;
    return result;
  }
};

function countContimuous(item, itemPre) {
  if (item.status.win < 0) {
    item.timeLoseContinuous = itemPre.timeLoseContinuous - 1;
    item.oddsMoving.timeLoseContinuous = item.timeLoseContinuous;

    item.timeWinContinuous = 0;
  } else if (item.status.win > 0) {
    item.timeWinContinuous = itemPre.timeWinContinuous + 1;
    item.oddsMoving.timeWinContinuous = item.timeWinContinuous;

    item.timeLoseContinuous = 0;
  }
}

function QueueMovingOdds(length, /*optional*/preItems) {
  // Asign dataField before Queue.apply, or _validate will occur error
  this.dataField = ['win'];
  Queue.apply(this, arguments);

  this.taType = 'movingOdds';
}

Queue.extend(QueueMovingOdds, proto);
module.exports = QueueMovingOdds;