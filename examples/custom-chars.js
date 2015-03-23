// Any copyright is dedicated to the Public Domain.
// http://creativecommons.org/publicdomain/zero/1.0/

/*********************************************
This basic screen example writes a string to
the Nokia 5110 screen connected to port D
*********************************************/

var tessel = require('tessel');
var nokia5110 = require('../').use(tessel.port.D);
var degreeSign = [0x00,0x06,0x09,0x06,0x00];

nokia5110.on('ready', function(){
  nokia5110.clear();
  nokia5110.print('Temp: 12.3~C', 0, 0); // Use built in degree definition in SmallFont font
  nokia5110.print('Temp: 14.6 C', 0, 8);
  nokia5110.rawCharacter(degreeSign, 62, 1); // Insert custom degree symbol on line 2 (index 1) 62 pixels in
  nokia5110.update(function(){
    console.log("Done!");
  });
});