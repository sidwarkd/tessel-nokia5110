// Any copyright is dedicated to the Public Domain.
// http://creativecommons.org/publicdomain/zero/1.0/

/*********************************************
This basic screen example writes a string to
the Nokia 5110 screen connected to port D
*********************************************/

var tessel = require('tessel');
var nokia5110 = require('../').use(tessel.port['D']);

var CENTER = 9998;

nokia5110.on('ready', function(){
		nokia5110.print("Hello Tessel!", CENTER, 20);
    nokia5110.update(function(err){
      console.log("Your text is ready.");
    });
});