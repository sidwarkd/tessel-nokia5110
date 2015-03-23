# Nokia 5110 Graphic LCD
A simple Tessel library for interacting with the Nokia 5110 display. The library is a port of the [LCD5110_Graph](http://www.rinkydinkelectronics.com/library.php?id=47) library by Henning Karlsen. Most of the functions are supported with the exception of *printNumF* and *printNumI*. Performance is generally good except for printing characters. It seems that the math involved with rendering characters is slow on the Tessel. Entire screen updates take about 200ms on average.

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

var CENTER = 9998;

nokia5110.on('ready', function(){
    nokia5110.print("Hello Tessel!", CENTER, 20);
    nokia5110.update(function(err){
      console.log("Your text is ready.");
    });
});
```

### Event
Nokia5110.on(**'ready'**, callback(err, screen)) - Emitted when the screen object is first initialized

### Methods
Nokia5110.**update**([callback(err)]) - Updates the display with the contents of *scrbuf*

Nokia5110.**clear**([callback(err)]) - Clears the display

Nokia5110.**fill**() - Turns on every pixel in *scrbuf*

Nokia5110.**setContrast**(contrast, [callback(err)]) - Adjust contrast of screen. *contrast* can be any value between 0x00 and 0x7F

Nokia5110.**setPixel**(x, y) - Sets pixel at location (x,y)

Nokia5110.**clrPixel**(x, y) - Clears the pixel at location (x,y)

Nokia5110.**invPixel**(x, y) - Invert the state of the pixel at location (x,y)

Nokia5110.**print**(str, x, y) - Write the string *str* at location (x,y). The default font is SmallFont.

Nokia5110.**setFont**(font) - Sets the current font. See **Members** below for more info on using the *fonts* member of the screen object.

Nokia5110.**drawHLine**(x, y, len) - Draws a horizontal line starting at location (x,y) that is *len* pixels long.

Nokia5110.**clrHLine**(x, y, len) - Removes *len* pixels of the horizontal line that starts at location (x,y).

Nokia5110.**drawVLine**(x, y, len) - Draws a vertical line starting at location (x,y) that is *len* pixels long.

Nokia5110.**clrVLine**(x, y, len) - Removes *len* pixels of the horizontal line that starts at location (x,y).

Nokia5110.**drawLine**(x1, y1, x2, y2) - Draws a line from location (x1,y1) to (x2,y2).

Nokia5110.**clrLine**(x1, y1, x2, y2) - Clears a line on the screen from location (x1,y1) to (x2,y2).

Nokia5110.**drawRect**(x1, y1, x2, y2) - Draws a rectangle that has a top left corner at (x1,y1) and a lower right corner at (x2,y2).

Nokia5110.**clrRect**(x1, y1, x2, y2) - Removes a rectangle that has a top left corner at (x1,y1) and a lower right corner at (x2,y2).

Nokia5110.**drawRoundRect**(x1, y1, x2, y2) - Same as *drawRect* but adds a rounded look to the rectangle corners.

Nokia5110.**clrRoundRect**(x1, y1, x2, y2) - Removes a rounded rectangle that has a top left corner at (x1,y1) and a lower right corner at (x2,y2).

Nokia5110.**drawCircle**(x, y, radius) - Draws a circle that is centered at location (x,y) with *radius*.

Nokia5110.**clrCircle**(x, y, radius) - Removes a circle that is centered at location (x,y) with *radius*.

Nokia5110.**drawBitmap**(x, y, bitmap, sx, sy) - Draw *bitmap*(defined as byte array) at location (x,y). *sx* and *sy* define the size.

Nokia5110.**drawPreSizedBitmap**(bitmap) - Draw *bitmap* by simply copying the bits onto the screen. This is **much faster** than *drawBitmap* but does not allow you to change the location.

Nokia5110.**setBacklight**(state) - Turns the backlight on if _state_ is truthy, off otherwise.

### Members
Nokia5110.**fonts** - Contains definitions of the supported fonts. SmallFont, TinyFont, MediumNumbers, BigNumbers.

Nokia5110.**scrbuf** - The 504 byte raw buffer that is used to update the screen.

Nokia5110.**CENTER** - Can be used in calls to print to center text

Nokia5110.**LEFT** - Can be used in calls to print to left-align text

Nokia5110.**RIGHT** - Can be used in calls to print to right-align text

### Development Note
Almost all of the library calls simply update a display buffer without actually updating the screen. This is useful for making multiple changes to the screen at once without the overhead of actually redrawing the screen. To help with performance only call *update()* when you are actually ready for the screen to refresh. 

### Further Examples  
* [Full Graphic Demo](examples/graphics.js). Demonstrates all display capabilities.
* [Tiny Font](examples/tinyfont.js). Demonstrates how to change the font and what the TinyFont looks like.
* [Scrolling Text](examples/scrolling_text.js). Demonstrates how to get scrolling text. **Runs very slow**
* [Bitmap Display](examples/bitmap.js). Demonstrates how to display a monochrome bitmap on the lcd.
* [Static Display](examples/features.js). Demonstrates some of basic graphic calls to create a static screen.

### Version History
#### v2.0.0 - Complete rewrite to port LCD5110_Graph library.
  * Rewrote SPI interface code for major performance boost
  * Removed async library to improve performance
  * Added additional examples

#### v1.0.1 - Updated examples to remove async calls
#### v1.0.0 - Initial version

### Licensing  
Apache 2.0
