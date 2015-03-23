var tessel = require('tessel');
var nokia5110 = require('../').use(tessel.port['D']);
var fonts = require('../fonts.js');
var CENTER = 9998;

nokia5110.on('ready', function(){
  
  nokia5110.setFont(fonts.TinyFont);
  nokia5110.print("0123456789:;<=>?", CENTER, 6);
  nokia5110.print("@ABCDEFGHIJKLMNO", CENTER, 12);
  nokia5110.print("PQRSTUVWXYZ[]^_", CENTER, 18);
  nokia5110.print("`abcdefghijklmno", CENTER, 24);
  nokia5110.print("pqrstuvwxyz{|}~ ", CENTER, 30);
  nokia5110.update(function(err){
    console.log("Finished rendering Tiny Font demo.");
  });

});