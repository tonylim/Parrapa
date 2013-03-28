/**
 * @fileoverview An animation class that animates by changing the
 * CSS top, left or CSS3 translate position.
 *
 * @author Joe Zhou(yixiong.zhou@b-reel.com)
 */

goog.provide('goog.fx.SimpleSprite');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.events.EventTarget');
goog.require('goog.math.Size');
goog.require('goog.style');
goog.require('goog.userAgent');


/**
 * This animation class is used to animate a CSS sprite
 * This moves through a series of images in a single image sprite by
 * an external iteration/looping function.
 *
 * @param {Images} image(s) The HTML image elements to serve as a spritesheet.
 * @param {function(number) : number=} opt_acc Acceleration function,
 *    returns 0-1 for inputs 0-1.  This can be used to make certain frames be
 *    shown for a longer period of time.
 *
 * Image frame specification
 * image01 [01, 02, 03] image02 [04, 05, 06]
 *         [07, 08, 09]         [10, 11, 12]
 *         [13, 14, 15]         [16, 17, 18]
 *         ...
 * 
 * @constructor
 * @extends {goog.events.EventTarget}
 */
goog.fx.SimpleSprite = function(images, rows, cols, aNumEmptyFrames, useCSS3) {
  goog.base(this);

  this.rows = rows;
  this.cols = cols;

  var numEmptyFrames = aNumEmptyFrames || 0;
  this.numFrames = rows * cols - numEmptyFrames;

  this.frameId = 0;
  this.frames = [];
  this.progress = 0;

  this.useCSS3 = useCSS3 || false;

  this.domElement = goog.dom.createDom('div');
  this.spritesheetWrapperDom = goog.dom.createDom('div');
  goog.style.setStyle(this.spritesheetWrapperDom, 'position', 'relative');
  goog.dom.appendChild(this.domElement, this.spritesheetWrapperDom);

  this.spritesheetImages = goog.isArray(images) ? images : [images];
  this.spritesheetSize = new goog.math.Size(0, 0);

  goog.array.forEach(this.spritesheetImages, function(image, index) {
    this.spritesheetSize.width += image['naturalWidth'] || image.width;
    this.spritesheetSize.height = image['naturalHeight'] || image.height;
    image['draggable'] = false;
    goog.style.setFloat(image, 'left');
    goog.dom.appendChild(this.spritesheetWrapperDom, image);
  }, this);

  // set viewport size
  //console.log(this.spritesheetSize.width +', ' + cols +', ' + this.spritesheetSize.height +', ' + rows);
  this.size = new goog.math.Size(this.spritesheetSize.width/cols, this.spritesheetSize.height/rows);

  goog.style.setStyle(this.domElement, 'overflow', 'hidden');
  this.setSize(this.size.width, this.size.height);

  // check css3 support
  var supportTransform = goog.isDef(this.domElement.style['transform']) ||
          goog.isDef(this.domElement.style['WebkitTransform']) ||
          goog.isDef(this.domElement.style['MozTransform']) ||
          goog.isDef(this.domElement.style['OTransform']);

  this.supportTransform3d = (function() {
    return ('WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix());
  })();

  this.transformProperty = (function() {
    if(supportTransform) {
      if (goog.userAgent.IE) {
        return '-ms-transform';
      } else if (goog.userAgent.WEBKIT) {
        return '-webkit-transform';
      } else if (goog.userAgent.OPERA) {
        return '-o-transform';
      } else if (goog.userAgent.GECKO) {
        return '-moz-transform';
      } else {
        return 'transform';
      }
    }

    return null;
  })();

  //
  this.updateCoords(this.progress);
};
goog.inherits(goog.fx.SimpleSprite, goog.events.EventTarget);


goog.fx.SimpleSprite.prototype.getProgress = function() {
  return this.progress;
};


goog.fx.SimpleSprite.prototype.getProgressByFrame = function(frame) {
  return frame/(this.numFrames-1);
};


goog.fx.SimpleSprite.prototype.setSize = function(w, h) {
  var numImages = this.spritesheetImages.length;

  var divisibleWidth = Math.round(w / this.cols * this.cols);
  var divisibleHeight = Math.round(h / this.rows * this.rows);

  // re-calculate total spritesheet(s) size
  goog.array.forEach(this.spritesheetImages, function(image, index) {
    image.width = this.cols / numImages * divisibleWidth;
    image.height = this.rows * divisibleHeight;
  }, this);

  this.spritesheetSize.width = this.cols * divisibleWidth;
  this.spritesheetSize.height = this.rows * divisibleHeight;

  this.size.width = divisibleWidth;
  this.size.height = divisibleHeight;

  goog.array.clear(this.frames);

  var col;
  var row;
  var frame;
  for(row = 0; row < this.rows; row++) {       
    for(col = 0; col < this.cols; col++) {
      var frame = [];
      frame[0] = col * divisibleWidth;
      frame[1] = row * divisibleHeight;
      this.frames.push(frame);
    }
  };

  this.render(this.frames[this.frameId][0], this.frames[this.frameId][1]);

  goog.style.setSize(this.spritesheetWrapperDom, this.spritesheetSize);
  goog.style.setSize(this.domElement, this.size);
};


/**
 * Calculates current coordinates, based on the current state.  Applies
 * the acframeeration function if it exists.
 * @param {number} t Percentage of the way through the animation as a decimal.
 * @override
 */
goog.fx.SimpleSprite.prototype.updateCoords = function(t) {
  this.frameId = Math.round( (this.numFrames - 1) * t );

  this.coords = [];
  this.coords[0] = this.frames[this.frameId][0];
  this.coords[1] = this.frames[this.frameId][1];
};


goog.fx.SimpleSprite.prototype.render = function(aX, aY) {
  var x = (aX != undefined) ? -aX : -this.coords[0];
  var y = (aY != undefined) ? -aY : -this.coords[1];

  var useCSS3 = this.useCSS3;
  if(goog.userAgent.IE) useCSS3 = false;

  if(this.transformProperty && useCSS3) {
    if(this.supportTransform3d) {
      goog.style.setStyle(this.spritesheetWrapperDom, this.transformProperty, 'translate3d('+x+'px,'+y+'px, 0px)');
    }else {
      goog.style.setStyle(this.spritesheetWrapperDom, this.transformProperty, 'translate('+x+'px,'+y+'px)');
    }
  }else {
    goog.style.setPosition(this.spritesheetWrapperDom, x, y);
  }
};


goog.fx.SimpleSprite.prototype.gotoFrame = function(frame) {
  this.progress = this.getProgressByFrame(frame);
  this.updateCoords(this.progress);
  this.render();
};


goog.fx.SimpleSprite.prototype.gotoProgress = function(progress) {
  this.progress = progress;
  this.updateCoords(this.progress);
  this.render();
};