// Any copyright is dedicated to the Public Domain.
// http://creativecommons.org/publicdomain/zero/1.0/

/*********************************************
Example of print function and how it can be 
used to scroll text on a screen connected to 
port D. The print function currently runs 
extremely slow (~1s). Will update the library
if I find a solution.
*********************************************/

var tessel = require('tessel');
var nokia5110 = require('../').use(tessel.port['D']);

var CENTER = 9998;

nokia5110.on('ready', function(){
  nokia5110.setBacklight(true);
  var done = true;
  var y = Math.floor(Math.random() * 40);
  var i = 84;

  var scrollIt = function(){
    if(i >= (-34*6)){
      nokia5110.print("Scrolling Text Demo ", i--, y);
      nokia5110.update(function(err){
        return scrollIt();
      });
    }
    else{
      i = 84;
      y = Math.floor(Math.random() * 40);
    }
  };

  setImmediate(scrollIt);

});