const Queue = require('./Queue.js');

const proto = {
  /**
   * Private method. To validate if doc is in proper format
   * @param {Object} stick
   * @param {number} stick.time
   * @param {number} stick.dif
   * @param {string} stick.buyTrend
   */
  _validate: function (stick) {
    let status = stick.status;

    if (!status.time || typeof status.time !== 'number') return false;
    return this.dataField.every(fieldName => {
      return (status[fieldName] !== undefined);
    });
  },

  _calculate: function () {
    let curStick = this.items[this.len - 1];
    let preStick = this.items[this.len - 2];
    let timeWin = this.items.reduce((pre, cur) => { return pre + ((cur.status.win > 0) ? cur.status.win : 0); }, 0);
    curStick.oddsMoving = {
      time: curStick.status.time,
      timeWin: timeWin,
      winRate: timeWin / this.len
    };

    if (this.items.length === this.len && !this.items[0].oddsMoving) {
      this.items.forEach((stick, i, arr) => {
        stick.oddsMoving = stick.oddsMoving || {};
        if (i == 0) {
          if (stick.status.win > 0) {
            stick.timeWinContinuous = 1;
            stick.timeLoseContinuous = 0;
            stick.oddsMoving.timeWinContinuous = 1;
          } else {
            stick.timeLoseContinuous = 1;
            stick.timeWinContinuous = 0;
            stick.oddsMoving.timeLoseContinuous = 1;
          }
        } else {
          countContimuous(stick, arr[i - 1]);
        }
      });
    }

    countContimuous(curStick, preStick);
  },

  _shift: function (itemShifted) {
    if (!itemShifted.oddsMoving) return;

    let result = itemShifted.oddsMoving;
    result.time = itemShifted.status.time;
    return result;
  }
};

function countContimuous(curStick, preStick) {
  if (curStick.status.win < 0) {
    curStick.timeLoseContinuous = preStick.timeLoseContinuous - 1;
    curStick.oddsMoving.timeLoseContinuous = curStick.timeLoseContinuous;

    curStick.timeWinContinuous = 0;
  } else if (curStick.status.win > 0) {
    curStick.timeWinContinuous = preStick.timeWinContinuous + 1;
    curStick.oddsMoving.timeWinContinuous = curStick.timeWinContinuous;

    curStick.timeLoseContinuous = 0;
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