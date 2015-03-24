var tessel = require('tessel');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var fonts = require('./fonts.js');

// Screen is six rows (pages) with each byte being eight vertical pixels.
var LCD_WIDTH = 84;
var LCD_HEIGHT = 48;

var LEFT = 0;
var RIGHT = 9999;
var CENTER = 9998;

var LCD_COMMAND = 0;
var LCD_DATA = 1;


var PCD8544_POWERDOWN = 0x04;
var PCD8544_ENTRYMODE = 0x02;
var PCD8544_EXTENDEDINSTRUCTION = 0x01;

var PCD8544_DISPLAYBLANK = 0x00;
var PCD8544_DISPLAYNORMAL = 0x04;
var PCD8544_DISPLAYALLON = 0x01;
var PCD8544_DISPLAYINVERTED = 0x05;

// H = 0
var PCD8544_FUNCTIONSET = 0x20;
var PCD8544_DISPLAYCONTROL = 0x08;
var PCD8544_SETYADDR = 0x40;
var PCD8544_SETXADDR = 0x80;

// H = 1
var PCD8544_SETTEMP = 0x04;
var PCD8544_SETBIAS = 0x10;
var PCD8544_SETVOP = 0x80;

// Display presets
var LCD_BIAS = 0x03;
var LCD_TEMP = 0x02;
var LCD_CONTRAST = 0x46;


function Nokia5110 (hardware, cb){
  var self = this;
  self.hardware = hardware;
  self.sce = hardware.pin['G1'].output().low();
  self.dc = hardware.pin['G2'].output().low();
  self.backlight = hardware.pin['G3'].output().low();

  self.scrbuf = new Buffer(504);

  // Default the font to SmallFont in fonts.js
  self.fonts = fonts;
  self.cfont = {
    font:fonts.SmallFont,
    x_size:fonts.SmallFont[0],
    y_size:fonts.SmallFont[1],
    offset:fonts.SmallFont[2],
    numchars:fonts.SmallFont[3],
    inverted:0
  };

  self.CENTER = CENTER;
  self.LEFT = LEFT;
  self.RIGHT = RIGHT;

  self.spi = new hardware.SPI({
    clockSpeed: 4 * 1000000,
    dataMode: 0
  });

  self._lcdWrite = function(mode, data, cb){
    var self = this;
    self.dc.output(mode);
    self.sce.low();
    self.spi.send(data, function (err){
      self.sce.high();
      cb(err);
    });
  };

  var contrast = 0x3a; //0x3a;
  var initCommands = [PCD8544_FUNCTIONSET | PCD8544_EXTENDEDINSTRUCTION,
    PCD8544_SETBIAS | LCD_BIAS,
    PCD8544_SETVOP | LCD_CONTRAST,
    PCD8544_SETTEMP | LCD_TEMP,
    PCD8544_FUNCTIONSET,
    PCD8544_SETYADDR,
    PCD8544_SETXADDR,
    PCD8544_DISPLAYCONTROL | PCD8544_DISPLAYNORMAL
  ];
  self._lcdWrite(LCD_COMMAND, new Buffer(initCommands), function(err){
    self.emit('ready');
    if(cb)
      cb(err, self);
  });
};

// Inherit event emission
util.inherits(Nokia5110, EventEmitter);

// Define the API
Nokia5110.prototype.setMode = function(mode, cb){
  if(mode != PCD8544_DISPLAYALLON && mode != PCD8544_DISPLAYNORMAL && mode != PCD8544_DISPLAYINVERTED && mode != PCD8544_DISPLAYBLANK)
    cb("Invalid Mode");
  else{
    this._lcdWrite(LCD_COMMAND, new Buffer([PCD8544_DISPLAYCONTROL | mode]), function(err){
      if(cb)
        cb(err);
    });
  }
};

Nokia5110.prototype.update = function(cb){
  var self = this;
  self._lcdWrite(LCD_COMMAND, new Buffer([PCD8544_SETYADDR, PCD8544_SETXADDR]), function(err){
    if(err)
      cb(err);
    else{
      self._lcdWrite(LCD_DATA, self.scrbuf, function(err){
        if(cb)
          cb(err);
      });
    }
  });
};

Nokia5110.prototype.clear = function (){
  for (var c = 0; c < 504; c++)
    this.scrbuf[c] = 0;
};

Nokia5110.prototype.fill = function(){
  for (var c = 0; c < 504; c++)
    this.scrbuf[c] = 255;
}

Nokia5110.prototype.setContrast = function(contrast, cb){
  if(contrast > 0x7F)
    contrast = 0x7F;
  if(contrast < 0)
    contrast = 0;

  var commands = new Buffer([PCD8544_FUNCTIONSET | PCD8544_EXTENDEDINSTRUCTION,
    PCD8544_SETVOP | contrast,
    PCD8544_FUNCTIONSET]);

  this._lcdWrite(LCD_COMMAND, commands, function(err){
    if(cb)
      cb(err);
  });
}

Nokia5110.prototype.setPixel = function(x, y) {
  if((x >= 0) && (x < 84) && (y >= 0) && (y < 48)){
    var by = (parseInt((y/8))*84) + x;
    var bi = y % 8;

    this.scrbuf[by] = this.scrbuf[by] | (1 << bi);
  }
};

Nokia5110.prototype.clrPixel = function(x, y){
  if ((x>=0) && (x<84) && (y>=0) && (y<48)){
    var by=(parseInt((y/8))*84)+x;
    var bi=y % 8;

    this.scrbuf[by]=this.scrbuf[by] & ~(1<<bi);
  }
};

Nokia5110.prototype.invPixel = function(x, y){
  if ((x>=0) && (x<84) && (y>=0) && (y<48)){
    var by=(parseInt((y/8))*84)+x;
    var bi=y % 8;

    if ((this.scrbuf[by] & (1<<bi))==0)
      this.scrbuf[by]=this.scrbuf[by] | (1<<bi);
    else
      this.scrbuf[by]=this.scrbuf[by] & ~(1<<bi);
  }
};

Nokia5110.prototype.print = function(st, x, y){
  var ch;
  var stl = st.length;

  if (x == RIGHT)
    x = 84-(stl*this.cfont.x_size);
  if (x == CENTER)
    x = parseInt((84-(stl*this.cfont.x_size))/2);

  for (var cnt=0; cnt<stl; cnt++)
      this._print_char(st[cnt], x + (cnt*this.cfont.x_size), y);

};

Nokia5110.prototype.printNumI = function(num, x, y, length, filler){
  var buf = new Array(25);
  var st = new Array(27);
  var neg = false;
  var c=0;
  var f=0;
  
  if (num==0)
  {
    if (length!=0)
    {
      for (c=0; c<(length-1); c++)
        st[c]=filler;
      st[c]=48;
      st[c+1]=0;
    }
    else
    {
      st[0]=48;
      st[1]=0;
    }
  }
  else
  {
    if (num<0)
    {
      neg=true;
      num=-num;
    }
    
    while (num>0)
    {
      buf[c]=48+(num % 10);
      c++;
      num=parseInt((num-(num % 10))/10);
    }
    buf[c]=0;
    
    if (neg)
    {
      st[0]=45;
    }
    
    if (length>(c+neg))
    {
      for (var i=0; i<(length-c-neg); i++)
      {
        st[i+neg]=filler;
        f++;
      }
    }

    for (var i=0; i<c; i++)
    {
      st[i+neg+f]=buf[c-i-1];
    }
    st[c+neg+f]=0;

  }

  this.print(st,x,y);
};

Nokia5110.prototype._print_char = function(c, x, y){
  if ((this.cfont.y_size % 8) == 0)
  {
    var font_idx = ((c.charCodeAt(0) - this.cfont.offset)*(this.cfont.x_size*(parseInt(this.cfont.y_size/8))))+4;
    for (var rowcnt=0; rowcnt<(parseInt(this.cfont.y_size/8)); rowcnt++)
    {
      for(var cnt=0; cnt<this.cfont.x_size; cnt++)
      {
        for (var b=0; b<8; b++)
          if ((this.cfont.font[font_idx+cnt+(rowcnt*this.cfont.x_size)] & (1<<b))!=0)
            if (this.cfont.inverted==0)
              this.setPixel(x+cnt, y+(rowcnt*8)+b);
            else
              this.clrPixel(x+cnt, y+(rowcnt*8)+b);
          else
            if (this.cfont.inverted==0)
              this.clrPixel(x+cnt, y+(rowcnt*8)+b);
            else
              this.setPixel(x+cnt, y+(rowcnt*8)+b);
      }
    }
  }
  else
  {
    var font_idx = ((c.charCodeAt(0) - this.cfont.offset)*(parseInt(this.cfont.x_size*this.cfont.y_size/8)))+4;
    var cbyte=this.cfont.font[font_idx];
    var cbit=7;
    for (var cx=0; cx<this.cfont.x_size; cx++)
    {
      for (var cy=0; cy<this.cfont.y_size; cy++)
      {
        if ((cbyte & (1<<cbit)) != 0)
          if (this.cfont.inverted==0)
            this.setPixel(x+cx, y+cy);
          else
            this.clrPixel(x+cx, y+cy);
        else
          if (this.cfont.inverted==0)
            this.clrPixel(x+cx, y+cy);
          else
            this.setPixel(x+cx, y+cy);
        cbit--;
        if (cbit<0)
        {
          cbit=7;
          font_idx++;
          cbyte=this.cfont.font[font_idx];
        }
      }
    }
  }
};

Nokia5110.prototype.setFont = function (font){
  this.cfont.font = font;
  this.cfont.x_size = font[0];
  this.cfont.y_size=font[1];
  this.cfont.offset=font[2];
  this.cfont.numchars=font[3];
  this.cfont.inverted=0;
};

Nokia5110.prototype.drawHLine = function(x, y, l){
  if ((x>=0) && (x<84) && (y>=0) && (y<48)){
    for(var cx = 0; cx < l; cx++){
      var by=(parseInt((y/8))*84)+x;
      var bi=y % 8;

      this.scrbuf[by+cx] |= (1<<bi);
    }
  }
};

Nokia5110.prototype.clrHLine = function(x, y, l){
  if ((x>=0) && (x<84) && (y>=0) && (y<48)){
    for (var cx=0; cx<l; cx++){
      var by=(parseInt((y/8))*84)+x;
      var bi=y % 8;

      this.scrbuf[by+cx] &= ~(1<<bi);
    }
  }
};

Nokia5110.prototype.drawVLine = function(x, y, l){
  if ((x>=0) && (x<84) && (y>=0) && (y<48)){
    for (var cy=0; cy<l; cy++){
      this.setPixel(x, y+cy);
    }
  }
};

Nokia5110.prototype.clrVLine = function(x, y, l){
  if ((x>=0) && (x<84) && (y>=0) && (y<48)){
    for (var cy=0; cy<l; cy++){
      this.clrPixel(x, y+cy);
    }
  }
};

Nokia5110.prototype.drawLine = function(x1, y1, x2, y2){
  var tmp = 0,
    delta = 0,
    tx = 0,
    ty = 0,
    m = 0,
    b = 0,
    dx = 0,
    dy = 0;

  if (((x2-x1)<0)){
    tmp=x1;
    x1=x2;
    x2=tmp;
    tmp=y1;
    y1=y2;
    y2=tmp;
  }
  if (((y2-y1)<0)){
    tmp=x1;
    x1=x2;
    x2=tmp;
    tmp=y1;
    y1=y2;
    y2=tmp;
  }

  if (y1==y2){
    if (x1>x2){
      tmp=x1;
      x1=x2;
      x2=tmp;
    }
    this.drawHLine(x1, y1, x2-x1);
  }
  else if (x1==x2){
    if (y1>y2){
      tmp=y1;
      y1=y2;
      y2=tmp;
    }
    this.drawVLine(x1, y1, y2-y1);
  }
  else if (Math.abs(x2-x1)>Math.abs(y2-y1)){
    delta=(y2-y1)/(x2-x1);
    ty=y1;
    if (x1>x2){
      for (var i=x1; i>=x2; i--){
        this.setPixel(i, parseInt(ty+0.5));
        ty=ty-delta;
      }
    }
    else{
      for (var i=x1; i<=x2; i++){
        this.setPixel(i, parseInt(ty+0.5));
        ty=ty+delta;
      }
    }
  }
  else{
    delta=(x2-x1)/(y2-y1);
    tx=x1;
    if (y1>y2){
      for (var i=y2+1; i>y1; i--){
        this.setPixel(parseInt(tx+0.5), i);
        tx=tx+delta;
      }
    }
    else{
      for (var i=y1; i<y2+1; i++){
        this.setPixel(parseInt(tx+0.5), i);
        tx=tx+delta;
      }
    }
  }
};

Nokia5110.prototype.clrLine = function(x1, y1, x2, y2){
  var tmp = 0,
    delta = 0,
    tx = 0,
    ty = 0,
    m = 0,
    b = 0,
    dx = 0,
    dy = 0;
  
  if (((x2-x1)<0)){
    tmp=x1;
    x1=x2;
    x2=tmp;
    tmp=y1;
    y1=y2;
    y2=tmp;
  }
  if (((y2-y1)<0)){
    tmp=x1;
    x1=x2;
    x2=tmp;
    tmp=y1;
    y1=y2;
    y2=tmp;
  }

  if (y1==y2){
    if (x1>x2){
      tmp=x1;
      x1=x2;
      x2=tmp;
    }
    this.clrHLine(x1, y1, x2-x1);
  }
  else if (x1==x2){
    if (y1>y2){
      tmp=y1;
      y1=y2;
      y2=tmp;
    }
    this.clrVLine(x1, y1, y2-y1);
  }
  else if (Math.abs(x2-x1)>Math.abs(y2-y1)){
    delta=(y2-y1)/(x2-x1);
    ty=y1;
    if (x1>x2){
      for (var i=x1; i>=x2; i--){
        this.clrPixel(i, parseInt(ty+0.5));
        ty=ty-delta;
      }
    }
    else{
      for (var i=x1; i<=x2; i++){
        this.clrPixel(i, parseInt(ty+0.5));
        ty=ty+delta;
      }
    }
  }
  else{
    delta=(x2-x1)/(y2-y1);
    tx=x1;
    if (y1>y2){
      for (var i=y2+1; i>y1; i--){
        this.clrPixel(parseInt(tx+0.5), i);
        tx=tx+delta;
      }
    }
    else{
      for (var i=y1; i<y2+1; i++){
        this.clrPixel(parseInt(tx+0.5), i);
        tx=tx+delta;
      }
    }
  }
};

Nokia5110.prototype.drawRect = function(x1, y1, x2, y2){
  var tmp;

  if (x1>x2){
    tmp=x1;
    x1=x2;
    x2=tmp;
  }
  if (y1>y2){
    tmp=y1;
    y1=y2;
    y2=tmp;
  }

  this.drawHLine(x1, y1, x2-x1);
  this.drawHLine(x1, y2, x2-x1);
  this.drawVLine(x1, y1, y2-y1);
  this.drawVLine(x2, y1, y2-y1+1);
};

Nokia5110.prototype.clrRect = function (x1, y1, x2, y2){
  var tmp;

  if (x1>x2)
  {
    tmp=x1;
    x1=x2;
    x2=tmp;
  }
  if (y1>y2)
  {
    tmp=y1;
    y1=y2;
    y2=tmp;
  }

  this.clrHLine(x1, y1, x2-x1);
  this.clrHLine(x1, y2, x2-x1);
  this.clrVLine(x1, y1, y2-y1);
  this.clrVLine(x2, y1, y2-y1+1);
};

Nokia5110.prototype.drawRoundRect = function(x1, y1, x2, y2){
  var tmp;

  if (x1>x2)
  {
    tmp=x1;
    x1=x2;
    x2=tmp;
  }
  if (y1>y2)
  {
    tmp=y1;
    y1=y2;
    y2=tmp;
  }
  if ((x2-x1)>4 && (y2-y1)>4)
  {
    this.setPixel(x1+1,y1+1);
    this.setPixel(x2-1,y1+1);
    this.setPixel(x1+1,y2-1);
    this.setPixel(x2-1,y2-1);
    this.drawHLine(x1+2, y1, x2-x1-3);
    this.drawHLine(x1+2, y2, x2-x1-3);
    this.drawVLine(x1, y1+2, y2-y1-3);
    this.drawVLine(x2, y1+2, y2-y1-3);
  }
};

Nokia5110.prototype.clrRoundRect = function(x1, y1, x2, y2){
  var tmp;

  if (x1>x2)
  {
    tmp=x1;
    x1=x2;
    x2=tmp;
  }
  if (y1>y2)
  {
    tmp=y1;
    y1=y2;
    y2=tmp;
  }
  if ((x2-x1)>4 && (y2-y1)>4)
  {
    this.clrPixel(x1+1,y1+1);
    this.clrPixel(x2-1,y1+1);
    this.clrPixel(x1+1,y2-1);
    this.clrPixel(x2-1,y2-1);
    this.clrHLine(x1+2, y1, x2-x1-3);
    this.clrHLine(x1+2, y2, x2-x1-3);
    this.clrVLine(x1, y1+2, y2-y1-3);
    this.clrVLine(x2, y1+2, y2-y1-3);
  }
};

Nokia5110.prototype.drawCircle = function (x, y, radius){
  var f = 1 - radius;
  var ddF_x = 1;
  var ddF_y = -2 * radius;
  var x1 = 0;
  var y1 = radius;
  var ch, cl;
  
  this.setPixel(x, y + radius);
  this.setPixel(x, y - radius);
  this.setPixel(x + radius, y);
  this.setPixel(x - radius, y);
 
  while(x1 < y1)
  {
    if(f >= 0) 
    {
      y1--;
      ddF_y += 2;
      f += ddF_y;
    }
    x1++;
    ddF_x += 2;
    f += ddF_x;    
    this.setPixel(x + x1, y + y1);
    this.setPixel(x - x1, y + y1);
    this.setPixel(x + x1, y - y1);
    this.setPixel(x - x1, y - y1);
    this.setPixel(x + y1, y + x1);
    this.setPixel(x - y1, y + x1);
    this.setPixel(x + y1, y - x1);
    this.setPixel(x - y1, y - x1);
  }
};

Nokia5110.prototype.clrCircle = function(x, y, radius){
  var f = 1 - radius;
  var ddF_x = 1;
  var ddF_y = -2 * radius;
  var x1 = 0;
  var y1 = radius;
  var ch, cl;
  
  this.clrPixel(x, y + radius);
  this.clrPixel(x, y - radius);
  this.clrPixel(x + radius, y);
  this.clrPixel(x - radius, y);
 
  while(x1 < y1)
  {
    if(f >= 0) 
    {
      y1--;
      ddF_y += 2;
      f += ddF_y;
    }
    x1++;
    ddF_x += 2;
    f += ddF_x;    
    this.clrPixel(x + x1, y + y1);
    this.clrPixel(x - x1, y + y1);
    this.clrPixel(x + x1, y - y1);
    this.clrPixel(x - x1, y - y1);
    this.clrPixel(x + y1, y + x1);
    this.clrPixel(x - y1, y + x1);
    this.clrPixel(x + y1, y - x1);
    this.clrPixel(x - y1, y - x1);
  }
};

// Unlike _print_char this function doesn't allow you to put a character
// absolutely anywhere. It limits you to the 5110's y lines (0-5). This
// function will be the base of the next version of character printing
// as it is significantly faster than _print_char.

// character - a 5 byte encoding of pixels to create a character.
Nokia5110.prototype.rawCharacter = function(character, x, line){
  if(x < 0 || x > 83)
    x = 0;
  if(line < 0 || line > 5)
    line = 0;

  // Set the start index based on x and line
  var scrbufIndex = (line * 84) + x;

  for(var i = 0; i < character.length; i++)
    this.scrbuf[scrbufIndex++] = character[i];
};

Nokia5110.prototype.rawPrint = function(str, x, line){
  var scrbufIndex = (line * 84) + x;
  for(var i = 0; i < str.length; i++){
    var charIndex = (str[i].charCodeAt(0) - 0x20) * 5;
    for(var j = 0; j < 5; j++)
      this.scrbuf[scrbufIndex++] = fonts.ASCII[charIndex++];

    // Spacing between chars
    scrbufIndex++;
  }
};

Nokia5110.prototype.drawBitmap = function (x, y, bitmap, sx, sy){
  var bit;
  var data;

  for (var cy=0; cy<sy; cy++)
  {
    bit= cy % 8;
    for(var cx=0; cx<sx; cx++)
    {
      data=bitmap[cx+(parseInt(cy/8)*sx)];
      if ((data & (1<<bit))>0)
        this.setPixel(x+cx, y+cy);
      else
        this.clrPixel(x+cx, y+cy);
    }
  }   
};

Nokia5110.prototype.drawPreSizedBitmap = function(bitmap){
  var len = bitmap.length;
  for(var c = 0; c < len; c++){
    this.scrbuf[c] = bitmap[c];
  }
}

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