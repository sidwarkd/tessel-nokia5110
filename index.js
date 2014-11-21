var tessel = require('tessel');
var async = require('async');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

// Screen is six rows (pages) with each byte being eight vertical pixels.
var LCD_WIDTH = 84
var LCD_HEIGHT = 48

var LCD_COMMAND = 0;
var LCD_DATA = 1;


var PCD8544_POWERDOWN = 0x04
var PCD8544_ENTRYMODE = 0x02
var PCD8544_EXTENDEDINSTRUCTION = 0x01

var PCD8544_DISPLAYBLANK = 0x0
var PCD8544_DISPLAYNORMAL = 0x4
var PCD8544_DISPLAYALLON = 0x1
var PCD8544_DISPLAYINVERTED = 0x5

// H = 0
var PCD8544_FUNCTIONSET = 0x20
var PCD8544_DISPLAYCONTROL = 0x08
var PCD8544_SETYADDR = 0x40
var PCD8544_SETXADDR = 0x80

// H = 1
var PCD8544_SETTEMP = 0x04
var PCD8544_SETBIAS = 0x10
var PCD8544_SETVOP = 0x80

//This table contains the hex values that represent pixels
//for a font that is 5 pixels wide and 8 pixels high
var ASCII = [[0x00, 0x00, 0x00, 0x00, 0x00], // 20  
  [0x00, 0x00, 0x5f, 0x00, 0x00], // 21 !
  [0x00, 0x07, 0x00, 0x07, 0x00], // 22 "
  [0x14, 0x7f, 0x14, 0x7f, 0x14], // 23 #
  [0x24, 0x2a, 0x7f, 0x2a, 0x12], // 24 $
  [0x23, 0x13, 0x08, 0x64, 0x62], // 25 %
  [0x36, 0x49, 0x55, 0x22, 0x50], // 26 &
  [0x00, 0x05, 0x03, 0x00, 0x00], // 27 '
  [0x00, 0x1c, 0x22, 0x41, 0x00], // 28 (
  [0x00, 0x41, 0x22, 0x1c, 0x00], // 29 )
  [0x14, 0x08, 0x3e, 0x08, 0x14], // 2a *
  [0x08, 0x08, 0x3e, 0x08, 0x08], // 2b +
  [0x00, 0x50, 0x30, 0x00, 0x00], // 2c ,
  [0x08, 0x08, 0x08, 0x08, 0x08], // 2d -
  [0x00, 0x60, 0x60, 0x00, 0x00], // 2e .
  [0x20, 0x10, 0x08, 0x04, 0x02], // 2f /
  [0x3e, 0x51, 0x49, 0x45, 0x3e], // 30 0
  [0x00, 0x42, 0x7f, 0x40, 0x00], // 31 1
  [0x42, 0x61, 0x51, 0x49, 0x46], // 32 2
  [0x21, 0x41, 0x45, 0x4b, 0x31], // 33 3
  [0x18, 0x14, 0x12, 0x7f, 0x10], // 34 4
  [0x27, 0x45, 0x45, 0x45, 0x39], // 35 5
  [0x3c, 0x4a, 0x49, 0x49, 0x30], // 36 6
  [0x01, 0x71, 0x09, 0x05, 0x03], // 37 7
  [0x36, 0x49, 0x49, 0x49, 0x36], // 38 8
  [0x06, 0x49, 0x49, 0x29, 0x1e], // 39 9
  [0x00, 0x36, 0x36, 0x00, 0x00], // 3a :
  [0x00, 0x56, 0x36, 0x00, 0x00], // 3b ;
  [0x08, 0x14, 0x22, 0x41, 0x00], // 3c <
  [0x14, 0x14, 0x14, 0x14, 0x14], // 3d =
  [0x00, 0x41, 0x22, 0x14, 0x08], // 3e >
  [0x02, 0x01, 0x51, 0x09, 0x06], // 3f ?
  [0x32, 0x49, 0x79, 0x41, 0x3e], // 40 @
  [0x7e, 0x11, 0x11, 0x11, 0x7e], // 41 A
  [0x7f, 0x49, 0x49, 0x49, 0x36], // 42 B
  [0x3e, 0x41, 0x41, 0x41, 0x22], // 43 C
  [0x7f, 0x41, 0x41, 0x22, 0x1c], // 44 D
  [0x7f, 0x49, 0x49, 0x49, 0x41], // 45 E
  [0x7f, 0x09, 0x09, 0x09, 0x01], // 46 F
  [0x3e, 0x41, 0x49, 0x49, 0x7a], // 47 G
  [0x7f, 0x08, 0x08, 0x08, 0x7f], // 48 H
  [0x00, 0x41, 0x7f, 0x41, 0x00], // 49 I
  [0x20, 0x40, 0x41, 0x3f, 0x01], // 4a J
  [0x7f, 0x08, 0x14, 0x22, 0x41], // 4b K
  [0x7f, 0x40, 0x40, 0x40, 0x40], // 4c L
  [0x7f, 0x02, 0x0c, 0x02, 0x7f], // 4d M
  [0x7f, 0x04, 0x08, 0x10, 0x7f], // 4e N
  [0x3e, 0x41, 0x41, 0x41, 0x3e], // 4f O
  [0x7f, 0x09, 0x09, 0x09, 0x06], // 50 P
  [0x3e, 0x41, 0x51, 0x21, 0x5e], // 51 Q
  [0x7f, 0x09, 0x19, 0x29, 0x46], // 52 R
  [0x46, 0x49, 0x49, 0x49, 0x31], // 53 S
  [0x01, 0x01, 0x7f, 0x01, 0x01], // 54 T
  [0x3f, 0x40, 0x40, 0x40, 0x3f], // 55 U
  [0x1f, 0x20, 0x40, 0x20, 0x1f], // 56 V
  [0x3f, 0x40, 0x38, 0x40, 0x3f], // 57 W
  [0x63, 0x14, 0x08, 0x14, 0x63], // 58 X
  [0x07, 0x08, 0x70, 0x08, 0x07], // 59 Y
  [0x61, 0x51, 0x49, 0x45, 0x43], // 5a Z
  [0x00, 0x7f, 0x41, 0x41, 0x00], // 5b [
  [0x02, 0x04, 0x08, 0x10, 0x20], // 5c \
  [0x00, 0x41, 0x41, 0x7f, 0x00], // 5d ]
  [0x04, 0x02, 0x01, 0x02, 0x04], // 5e ^
  [0x40, 0x40, 0x40, 0x40, 0x40], // 5f _
  [0x00, 0x01, 0x02, 0x04, 0x00], // 60 `
  [0x20, 0x54, 0x54, 0x54, 0x78], // 61 a
  [0x7f, 0x48, 0x44, 0x44, 0x38], // 62 b
  [0x38, 0x44, 0x44, 0x44, 0x20], // 63 c
  [0x38, 0x44, 0x44, 0x48, 0x7f], // 64 d
  [0x38, 0x54, 0x54, 0x54, 0x18], // 65 e
  [0x08, 0x7e, 0x09, 0x01, 0x02], // 66 f
  [0x0c, 0x52, 0x52, 0x52, 0x3e], // 67 g
  [0x7f, 0x08, 0x04, 0x04, 0x78], // 68 h
  [0x00, 0x44, 0x7d, 0x40, 0x00], // 69 i
  [0x20, 0x40, 0x44, 0x3d, 0x00], // 6a j 
  [0x7f, 0x10, 0x28, 0x44, 0x00], // 6b k
  [0x00, 0x41, 0x7f, 0x40, 0x00], // 6c l
  [0x7c, 0x04, 0x18, 0x04, 0x78], // 6d m
  [0x7c, 0x08, 0x04, 0x04, 0x78], // 6e n
  [0x38, 0x44, 0x44, 0x44, 0x38], // 6f o
  [0x7c, 0x14, 0x14, 0x14, 0x08], // 70 p
  [0x08, 0x14, 0x14, 0x18, 0x7c], // 71 q
  [0x7c, 0x08, 0x04, 0x04, 0x08], // 72 r
  [0x48, 0x54, 0x54, 0x54, 0x20], // 73 s
  [0x04, 0x3f, 0x44, 0x40, 0x20], // 74 t
  [0x3c, 0x40, 0x40, 0x20, 0x7c], // 75 u
  [0x1c, 0x20, 0x40, 0x20, 0x1c], // 76 v
  [0x3c, 0x40, 0x30, 0x40, 0x3c], // 77 w
  [0x44, 0x28, 0x10, 0x28, 0x44], // 78 x
  [0x0c, 0x50, 0x50, 0x50, 0x3c], // 79 y
  [0x44, 0x64, 0x54, 0x4c, 0x44], // 7a z
  [0x00, 0x08, 0x36, 0x41, 0x00], // 7b {
  [0x00, 0x00, 0x7f, 0x00, 0x00], // 7c |
  [0x00, 0x41, 0x36, 0x08, 0x00], // 7d }
  [0x10, 0x08, 0x08, 0x10, 0x08], // 7e ~
  [0x78, 0x46, 0x41, 0x46, 0x78], // 7f DEL
];

function Nokia5110 (hardware, cb){
  var self = this;
  self.hardware = hardware;
  self.sce = hardware.pin['G1'].output().low();
  self.dc = hardware.pin['G2'].output().low();
  self.backlight = hardware.pin['G3'].output().low();

  self.spi = new hardware.SPI({
    clockSpeed: 8 * 1000000,
    dataMode: 0
  });

  self._lcdWrite = function(mode, data, cb){
    var self = this;
    self.dc.output(mode);
    self.sce.low();
    self.spi.send(new Buffer([data]), function (err){
      self.sce.high();
      cb(err);
    });
  };

  async.series([
    function(callback){
      // get into the EXTENDED mode!
      self._lcdWrite(LCD_COMMAND, PCD8544_FUNCTIONSET | PCD8544_EXTENDEDINSTRUCTION, callback);
    },
    function(callback){
      // LCD bias select (4 is optimal?)
      self._lcdWrite(LCD_COMMAND, PCD8544_SETBIAS | 0x4, callback);
    },
    function(callback){
      // set VOP
      var contrast = 0x3a;
      // You can play around with this value depending on your screen
      self._lcdWrite(LCD_COMMAND,  PCD8544_SETVOP | contrast, callback);
    },
    function(callback){
      // normal mode
      self._lcdWrite(LCD_COMMAND, PCD8544_FUNCTIONSET, callback);
    },
    function(callback){
      // Set display to Normal
      self._lcdWrite(LCD_COMMAND, PCD8544_DISPLAYCONTROL | PCD8544_DISPLAYNORMAL, callback);
    }
  ],
  function(err, results){
    self.emit('ready');
    if(cb)
      cb(err, self);
  });
};

// Inherit event emission
util.inherits(Nokia5110, EventEmitter);

// Define the API
Nokia5110.prototype.gotoXY = function (x, y, cb){
  var self = this;
  async.series([
    function(callback){
      self._lcdWrite(LCD_COMMAND, 0x80 | x, callback);
    },
    function(callback){
      self._lcdWrite(LCD_COMMAND, 0x40 | y, callback);
    }
  ], function(err, results){
      cb(err);
  });
};

Nokia5110.prototype.character = function (character, cb){
  var self = this;
  var charIndex = character.charCodeAt(0) - 0x20;
  async.series([
    function(callback){
      self._lcdWrite(LCD_DATA, 0x00, callback);
    },
    function(callback){
      self._lcdWrite(LCD_DATA, ASCII[charIndex][0], callback);
    },
    function(callback){
      self._lcdWrite(LCD_DATA, ASCII[charIndex][1], callback);
    },
    function(callback){
      self._lcdWrite(LCD_DATA, ASCII[charIndex][2], callback);
    },
    function(callback){
      self._lcdWrite(LCD_DATA, ASCII[charIndex][3], callback);
    },
    function(callback){
      self._lcdWrite(LCD_DATA, ASCII[charIndex][4], callback);
    },
  ], function(err, results){
    cb(err);
  });
};

Nokia5110.prototype.string = function (data, cb){
  var self = this;
  async.eachSeries(data, function(character, callback){
    self.character(character, callback);
  },
  function(err, results){
    if(cb)
      cb(err); 
  });
};

Nokia5110.prototype.bitmap = function (bitmapData, cb){
  var self = this;
  async.eachSeries(bitmapData, function(dataPoint, callback){
    self._lcdWrite(LCD_DATA, dataPoint, callback);
  },
  function(err, results){
    if(cb) 
      cb(err);
  });
};

Nokia5110.prototype.clear = function (cb){
  var self = this;
  async.timesSeries(LCD_WIDTH * LCD_HEIGHT / 8, function(n, next){
    self._lcdWrite(LCD_DATA, 0x00, next);
  },
  function(err, results){
    self.gotoXY(0,0, cb); // After clearing the display return to the home position
  });
};

Nokia5110.prototype.setBacklight = function (state){
  var self = this;
  self.backlight.output(state);
};

// Every module needs a use function which calls the constructor
function use (hardware, callback) {
  return new Nokia5110(hardware, callback);
}

// Export functions
exports.use = use;

/*
exports.use = function (port, cb)
{
  var PIN_SCE = port.pin['G1'].output().low();
  var PIN_DC = port.pin['G2'].output().low();
  var PIN_BACKLIGHT = port.pin['G3'].output().low();

  var spi = new port.SPI({
    clockSpeed: 8 * 1000000,
    dataMode: 0
  });


  function lcdWrite (mode, data, cb) {
    PIN_DC.output(mode);
    PIN_SCE.low();
    spi.send(new Buffer([data]), function (){
      PIN_SCE.high();
      cb(null, data);
    });
  }

  function lcdInit (cb) {
    // rst.high();
    async.series([
      function(callback){
        // get into the EXTENDED mode!
        lcdWrite(LCD_COMMAND, PCD8544_FUNCTIONSET | PCD8544_EXTENDEDINSTRUCTION, callback);
      },
      function(callback){
        // LCD bias select (4 is optimal?)
        lcdWrite(LCD_COMMAND, PCD8544_SETBIAS | 0x4, callback);
      },
      function(callback){
        // set VOP
        var contrast = 0x3a;
        // You can play around with this value depending on your screen
        lcdWrite(LCD_COMMAND,  PCD8544_SETVOP | contrast, callback);
      },
      function(callback){
        // normal mode
        lcdWrite(LCD_COMMAND, PCD8544_FUNCTIONSET, callback);
      },
      function(callback){
        // Set display to Normal
        lcdWrite(LCD_COMMAND, PCD8544_DISPLAYCONTROL | PCD8544_DISPLAYNORMAL, callback);
      }
    ],
    function(err, results){
      cb();
    });
  }

  function gotoXY(x, y, cb){
    async.series([
      function(callback){
        lcdWrite(LCD_COMMAND, 0x80 | x, callback);
      },
      function(callback){
        lcdWrite(LCD_COMMAND, 0x40 | y, callback);
      }
    ], function(err, results){
        cb();
    });
  }

  function lcdCharacter(character, cb){
    var charIndex = character.charCodeAt(0) - 0x20;
    async.series([
      function(callback){
        lcdWrite(LCD_DATA, 0x00, callback);
      },
      function(callback){
        lcdWrite(LCD_DATA, ASCII[charIndex][0], callback);
      },
      function(callback){
        lcdWrite(LCD_DATA, ASCII[charIndex][1], callback);
      },
      function(callback){
        lcdWrite(LCD_DATA, ASCII[charIndex][2], callback);
      },
      function(callback){
        lcdWrite(LCD_DATA, ASCII[charIndex][3], callback);
      },
      function(callback){
        lcdWrite(LCD_DATA, ASCII[charIndex][4], callback);
      },
    ], function(err, results){
      cb();
    });
  }

  function lcdString(data, cb){
    async.eachSeries(data, function(character, callback){
      lcdCharacter(character, callback);
    },
    function(err, results){
      if(cb){
        cb(); 
      }
    });
  }

  function lcdBitmap(data, callback){
    async.eachSeries(tessel_logo, function(dataPoint, callback){
      lcdWrite(LCD_DATA, dataPoint, callback);
    },
    function(err, results){
      if(callback) callback();
    });
  }

  function lcdClear(cb){
    async.timesSeries(LCD_WIDTH * LCD_HEIGHT / 8, function(n, next){
      lcdWrite(LCD_DATA, 0x00, next);
    },
    function(err, results){
      gotoXY(0,0, cb); // After clearing the display return to the home position
    });
  }

  function setBacklight(state){
    PIN_BACKLIGHT.output(state);
  }

  var ret = {
    width: LCD_WIDTH,
    height: LCD_HEIGHT,
    clear: lcdClear,
    writeChar: lcdCharacter,
    writeString: lcdString,
    drawArray: lcdBitmap,
    setBacklight: setBacklight
  };

  spi.initialize();
  lcdInit(cb);

  return ret;
}
*/