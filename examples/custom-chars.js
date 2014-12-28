// Any copyright is dedicated to the Public Domain.
// http://creativecommons.org/publicdomain/zero/1.0/

/*********************************************
This basic screen example writes a string to
the Nokia 5110 screen connected to port D
*********************************************/

var tessel = require('tessel');
var nokia5110 = require('../').use(tessel.port.D);
var degeeSign = [0x00,0x06,0x09,0x06,0x00];

nokia5110.on('ready', function(){
  nokia5110.clear(function(){
    nokia5110.string('Temp: 12.3', function(){
      nokia5110.rawCharacter(degreeSign, function(){
        nokia5110.character('C', function(){});
      });
    });
  });
});