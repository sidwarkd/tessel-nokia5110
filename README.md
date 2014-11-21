# Nokia 5110 Graphic LCD
A simple Tessel library for interacting with the Nokia 5110 display.

### Connection Information
The module uses the double-wide proto-module and can be installed on either side of the Tessel. It occupies two ports but only uses one of them (A or D).

### Hardware
The module uses the Nokia 5110 display which can be easily acquired online. A few options are:

  * [Sparkfun](https://www.sparkfun.com/products/10168)
  * [Adafruit](https://www.adafruit.com/products/338)
  * [Ebay](http://www.ebay.com/sch/i.html?_from=R40&_trksid=p2050601.m570.l1313.TR6.TRC1.A0.H0.Xnokia+5110&_nkw=nokia+5110&_sacat=0)

For connection information I followed the [wiring guide](https://learn.sparkfun.com/tutorials/graphic-lcd-hookup-guide) from Sparkfun.

### Installation
```sh
npm install tessel-nokia5110
```

### Example
```js
var tessel = require('tessel');

// Screen is connected to port D
var nokia5110 = require('tessel-nokia5110').use(tessel.port['D']);

nokia5110.on('ready', function(){
	nokia5110.clear(function(){
		nokia5110.string("Hello Tessel!");
	});
});
```

### Event
Nokia5110.**on**('ready', callback(err, screen)) - Emitted when the screen object is first initialized

### Methods
Nokia5110.**gotoXY**(x,y,[callback(err)]) - Sets the active cursor location to (x,y)

Nokia5110.**character**(char, [callback(err)]) - Writes a single character to the display

Nokia5110.**string**(data, [callback(err)]) - Writes a string to the display

Nokia5110.**bitmap**(bitmapData, [callback(err)]) - Draws a monochrome bitmap from _bitmapData_

Nokia5110.**clear**([callback(err)]) - Clears the display

Nokia5110.**setBacklight**(state) - Turns the backlight on if _state_ is truthy, off otherwise

### Further Examples  
* [Bitmap Display](examples/bitmap.js). Demonstrates how to display a monochrome bitmap on the lcd.

### Licensing  
Apache 2.0
