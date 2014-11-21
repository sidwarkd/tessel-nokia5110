// Any copyright is dedicated to the Public Domain.
// http://creativecommons.org/publicdomain/zero/1.0/

/*********************************************
This basic screen example writes a string to
the Nokia 5110 screen connected to port D
*********************************************/

var tessel = require('tessel');
var async = require('async');

var nokia5110 = require('../').use(tessel.port['D']);

nokia5110.on('ready', function(){
	nokia5110.clear(function(){
		nokia5110.string("Hello Tessel!");
	});
});