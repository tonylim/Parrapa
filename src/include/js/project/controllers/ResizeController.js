goog.provide('projname.controllers.ResizeController');

goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.dom.ViewportSizeMonitor');
goog.require('goog.events.EventType');
goog.require('goog.events.EventTarget');
goog.require('goog.math.Size');
goog.require('goog.style');
goog.require('goog.userAgent');

/**
 * @constructor
 */

projname.controllers.ResizeController = function() {
  goog.base(this);

  this.currentOrientation = '';
  this.contentWrapperDom = goog.dom.getElement('content-wrapper');

  this.viewportSizeMonitor = new goog.dom.ViewportSizeMonitor();
  this.windowSize = this.viewportSizeMonitor.getSize();

  this.resizables = [];

  this.minSize = new goog.math.Size(600, 600);
  this.rotatedMinSize = this.minSize.clone();
};
goog.inherits(projname.controllers.ResizeController, goog.events.EventTarget);
goog.addSingletonGetter(projname.controllers.ResizeController);


projname.controllers.ResizeController.prototype.init = function() {
  // listen for window resize event
  goog.events.listen(this.viewportSizeMonitor, goog.events.EventType.RESIZE, this.onResize, false, this);
  goog.events.listen(goog.dom.getWindow(), 'orientationchange', this.onResize, false, this);

  // auto trigger orientation change for mobile
  if(projname.isTouchAndMobile) {
    this.onResize();
  }
};


projname.controllers.ResizeController.prototype.registerResizableElement = function(element, index) {
  this.unregisterResizableElement(element);
  goog.array.insertAt(this.resizables, element, index || this.resizables.length-1);

  element.onResize(this.windowSize);
};


projname.controllers.ResizeController.prototype.unregisterResizableElement = function(element) {
  goog.array.remove(this.resizables, element);
};


projname.controllers.ResizeController.prototype.getResizableElementIndex = function(element) {
  return goog.array.indexOf(this.resizables, element);
};


projname.controllers.ResizeController.prototype.onResize = function(e) {
  this.windowSize = this.viewportSizeMonitor.getSize();

  this.windowSize.width = Math.max(this.windowSize.width, this.rotatedMinSize.width);
  this.windowSize.height = Math.max(this.windowSize.height, this.rotatedMinSize.height);

  goog.array.forEach(this.resizables, function(element) {
    if(element.onResize) {
      element.onResize(this.windowSize);
    }
  }, this);
};