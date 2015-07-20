var assert = require('assert');
var webdriver = require('selenium-webdriver');
var leaky = require('../lib/');
var path = require('path');
var config = {
  chromeOptions: 'no-sandbox'
};

describe('memory tests', function() {
  beforeEach(function() {
    if (typeof process.env.chromeBinaryPath !== 'undefined') {
      config.chromeBinaryPath = process.env.chromeBinaryPath;
    }

    this.results = [];
    this.driver = leaky.start(config);
  });

  afterEach(function() {
    return this.driver.quit();
  });

  it('should not leak on typing and clearing', function() {
    this.timeout(120 * 1000)
    this.driver.get('file://' + path.join(__dirname, 'examples/', 'input_typeAndClear.html'));

    leaky
      .getCounts(this.driver)
      .then(this.results.push.bind(this.results));

    this
      .driver
      .executeScript(':takeHeapSnapshot')
      .then(function(json){
        writeHeap('before', json);
      })
    for (var i = 0; i < 200; ++i) {
      get.call(this,  'input').sendKeys('B' + i);
      get.call(this, '#clear').click();
    }
    this.driver
      .executeScript(':takeHeapSnapshot')
      .then(function(json){
        writeHeap('after', json);
      })

    function get(selector) {
      return this.driver.findElement(webdriver.By.css(selector));
    }

    return leaky
      .getCounts(this.driver)
      .then(function(data) {
        assert.equal(this.results[0].nodes, data.nodes,
            'node count should match');
      }.bind(this));
  });

});

function writeHeap(filename, json) {
    var order = ['snapshot', 'nodes', 'edges', 'trace_function_infos', 'trace_tree', 'samples', 'strings'];
    var open = '{\n', close = '\n}\n';
    var keys = [];
    for (var key in json) {
      var fn = key === 'snapshot' ? 'unshift' : 'push';
      var index = order.indexOf(key);
      keys[index] = '"' + key + '":' + JSON.stringify(json[key]);
    }
    var str = open + keys.join('\n,\n') + close;

    require('fs').writeFileSync(filename + '.heapsnapshot', str);
}