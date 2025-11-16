# finance-indicators

A lightweight and extensible library for calculating finance technical indicators in Node.js. It provides a collection of common indicators and a simple base class for creating your own.

## Usage
Here's a basic example of how to use the built-in Moving Average (MA) indicator.

    const indicators = require('finance-indicators');

    // Create a new 5-period Moving Average indicator
    const ma5 = indicators.factory.create('ma', 5);

    const marketData = [
      { open: 9, high: 11, low: 8.5, close: 10 },
      { open: 10, high: 12, low: 9.5, close: 11 },
      { open: 11, high: 13, low: 10.5, close: 12 },
      { open: 12, high: 14, low: 11.5, close: 13 },
      { open: 13, high: 15, low: 12.5, close: 14 }, // After this point, MA will have a value
      { open: 14, high: 16, low: 13.5, close: 15 },
    ];

    marketData.forEach((tick, index) => {
      const result = ma5.enqueue(tick);
      // The indicator will only have a value after 'period' data points have been pushed.
      console.log(`Data point #${index + 1}:`);
      console.log(`  Input Close: ${tick.close}`);
      console.log(`  MA(5) Value: ${result}`); // get() returns the latest calculated value
      console.log('---');
    });

# 可以組合自己的指標
    indicators.Queue

# Creating a Custom Indicator
You can easily create your own indicator by extending the base Indicator class. You only need to implement the _calculate method.
## Core Concepts
1. Extend `Indicator`: Your custom class must extend require('finance-indicators/lib/indicator').
2. `constructor(options)`:
Always call super(options) to initialize the base indicator.
Define and validate any custom parameters your indicator needs (e.g., period).
3. `_calculate(data)`:
This is the core logic of your indicator.
It receives an array of the most recent data points. The length of this array is determined by the period you set.
It should return a single numerical value, which is the result of your indicator's calculation.
4. `_before(data)` (Optional Hook):
This optional method is called before _calculate().
You can use it to preprocess the incoming data if needed.
## Example: Creating a "Price Change" Indicator
Let's create a simple indicator that calculates the price change between the current and previous data point.

    const Indicator = require('./indicator');

    /**
    * PriceChange Indicator
    * Calculates the difference in price between the current and previous data point.
    */
    class PriceChange extends Indicator {
      constructor(options = {}) {
        // This indicator needs the current and previous data point.
        options.period = 2;
        super(options);

        // The 'key' determines which value to use from the data object (e.g., 'close', 'high').
        this.key = options.key || 'close';
      }

      /**
      * The main calculation logic.
      * @param {Array<Object>} data - An array of the last 'period' data points.
      * @returns {number} The calculated change in price.
      */
      _calculate(data) {
        // data[1] is the current data point, data[0] is the previous one.
        const currentPrice = data[1][this.key];
        const previousPrice = data[0][this.key];

        return currentPrice - previousPrice;
      }
    }

    module.exports = PriceChange;


## Using the Custom Indicator
Now, you can use PriceChange just like any other built-in indicator.

    const PriceChange = require('../lib/price-change');

    // Create an instance of our custom indicator, using the 'close' price.
    const priceChangeIndicator = new PriceChange({ key: 'close' });

    const marketData = [
      { close: 100 },
      { close: 102 }, // Change: +2
      { close: 101 }, // Change: -1
      { close: 105 }, // Change: +4
    ];

    marketData.forEach(tick => {
      priceChangeIndicator.push(tick);
      console.log(`Close: ${tick.close}, Change: ${priceChangeIndicator.get()}`);
    });

    /*
    Expected Output:
    Close: 100, Change: undefined
    Close: 102, Change: 2
    Close: 101, Change: -1
    Close: 105, Change: 4
    */

# Available Indicators
This library includes the following indicators:
* SMA (Simple Moving Average)
* EMA (Exponential Moving Average)
* VMA (Volume-weighted Moving Average)
* KDJ (Stochastic Oscillator)
* MACD (Moving Average Convergence Divergence)
* RSI (Relative Strength Index)
* Bollinger Band


# API Reference
new Indicator(options)
options.period (Number): The number of data points needed for one calculation.
options.key (String): The property name to access the numerical value from each data point object. Defaults to 'close'.
indicator.push(dataPoint)
Pushes a new data point into the indicator's history. The dataPoint is typically an object (e.g., { open, high, low, close }). The calculation is triggered automatically.
indicator.get()
Returns the latest calculated value of the indicator. Returns undefined if not enough data has been pushed to satisfy the period.
indicator.getHistory()
Returns an array of all calculated values.
