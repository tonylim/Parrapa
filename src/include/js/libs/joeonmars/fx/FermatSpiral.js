goog.provide('jomv3.fx.FermatSpiral');

/**
 * @constructor
 * This class generates a dots formation based on Fermat's Spiral
 */

jomv3.fx.FermatSpiral = function() {
  // store all dots' info, containing x, y, diameter, radius
  this.dots = [];
};


jomv3.fx.FermatSpiral.prototype.generate = function(numDots, angle, stretchFactor, smallestRad, largestRad, originX, originY) {
  // reset origin if provided
  this.setOrigin(originX || 0, originY || 0);

  // clear previous dots
  this.dots = [];

  var c = stretchFactor;
      
  var dotDiameter = 1.0;
  var i;
  var angleInRadians = goog.math.toRadians(angle);
  
  for(i = 0; i < numDots; i++) {
    var radius = c * Math.sqrt(i);
    var currentAngleMult = i * angleInRadians;

    var y = -1 * radius * Math.sin(currentAngleMult);
    var x = radius * Math.cos(currentAngleMult);

    var dotX = this.originX + x;
    var dotY = this.originY + y;

    //this isn't exact, but it's close enough for now
    dotDiameter = smallestRad * 2 + (i/numDots) * (largestRad * 2 - smallestRad * 2);
    
    this.dots[i] = {x:dotX, y:dotY, diameter:dotDiameter, radius:dotDiameter*.5};
  }

  return this.dots;
};


jomv3.fx.FermatSpiral.prototype.setOrigin = function(x, y) {
  this.originX = x;
  this.originY = y;
};

jomv3.fx.FermatSpiral.prototype.getTotalDots = function() {
  return this.dots.length;
};


jomv3.fx.FermatSpiral.prototype.onResize = function(windowSize) {

};


jomv3.fx.FermatSpiral.GOLDEN_ANGLE = 137.5;