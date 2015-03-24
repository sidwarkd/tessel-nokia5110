// Any copyright is dedicated to the Public Domain.
// http://creativecommons.org/publicdomain/zero/1.0/

/*********************************************
Used to do speed profiling on various calls
*********************************************/

var tessel = require('tessel');
var nokia5110 = require('../').use(tessel.port['D']);

var CENTER = 9998;

nokia5110.on('ready', function(){
  
  printTests(function(){
    console.log("\r\n\r\nDone Running Tests!");
  });

});

// Current average is 53ms for screen update
function updateTests(cb){
  var numTests = 0;
  var avgTime = 0;
  console.log("Screen Updates");
  console.log("==============");
  var start;
  var test = function(){
    if(numTests < 10){
      nokia5110.update(function(err){
        numTests++;
        test();
      });
    }
    else{
      var end = process.hrtime(start);
      var total = end[1]/1000000;
      console.log("Total: %dms", total);
      console.log("Avg: %dms", total / 10);
      cb();
    }
  };

  //start = new Date().getTime();
  start = process.hrtime();
  setImmediate(test);
}

function printTests(cb){
  var index = 0;
  var avgTime = 0;
  console.log("Print Tests");
  console.log("===========");
  var start;
  var end;
  var testStr = "This is a test string for benchmarking.";
  nokia5110.clear();
  start = process.hrtime();
  nokia5110.rawPrint(testStr, 0, 0);
  end = process.hrtime(start);
  var total = end[1]/1000000;
  console.log("Total: %dms", total);
  nokia5110.update(function(err){
    cb();
  });
}