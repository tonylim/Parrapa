/**
 * @fileoverview A singleton class managing all ScrollableElements,
 * this is automatically created by instantiating the first ScrollableElement by the user, 
 * thus should not be instantiated manually.
 *
 */
goog.provide('reasons.fx.ScrollableElementManager');

goog.require('goog.array');
goog.require('goog.events.EventType');
goog.require('goog.dom');
goog.require('goog.userAgent');

/**
 * @constructor
 */
reasons.fx.ScrollableElementManager = function() {
  this._scrollableElements = [];

  this._scrollPoints = [];

  goog.events.listen(document, reasons.fx.ScrollableElementManager.EventType.DOWN, this.onDown, false, this);
};
goog.addSingletonGetter(reasons.fx.ScrollableElementManager);


reasons.fx.ScrollableElementManager.prototype.add = function(scrollableElement) {
  this._scrollableElements.push(scrollableElement);
  
  // sort the elements from innermost to outermost
  // this allows mousedown handler to begin checking from the innermost element
  // in accordance to the order of event bubbling
  this._scrollableElements.sort(function (a, b) {
  return goog.dom.contains(a.outerElement, b.outerElement) ? 1 :
         goog.dom.contains(b.outerElement, a.outerElement) ? -1 :
         0;
  });
};


reasons.fx.ScrollableElementManager.prototype.remove = function(scrollableElement) {
  goog.array.remove(this._scrollableElements, scrollableElement);
};


reasons.fx.ScrollableElementManager.prototype.has = function(scrollableElement) {
  return goog.array.contains(this._scrollableElements, scrollableElement);
};


reasons.fx.ScrollableElementManager.prototype.onDown = function(e) {
  e.preventDefault();

  var ev = e.getBrowserEvent();
  this._scrollPoints.push( goog.userAgent.MOBILE ? [ev.touches[0].clientX, ev.touches[0].clientY] : [ev.clientX, ev.clientY] );

  goog.events.listen(document, reasons.fx.ScrollableElementManager.EventType.MOVE, this.onMove, false, this);
  goog.events.listen(document, reasons.fx.ScrollableElementManager.EventType.UP, this.onUp, false, this);
};


reasons.fx.ScrollableElementManager.prototype.onMove = function(e) {
  var ev = e.getBrowserEvent();

  if(this._scrollPoints.length < 2) {
    this._scrollPoints.push( goog.userAgent.MOBILE ? [ev.touches[0].clientX, ev.touches[0].clientY] : [ev.clientX, ev.clientY] );
  }

  if(this._scrollPoints.length >= 2) {

    var isScrollingX, isScrollingY;

    // determine direction by the scrolled points
    if(Math.abs(this._scrollPoints[0][0] - this._scrollPoints[1][0]) > Math.abs(this._scrollPoints[0][1] - this._scrollPoints[1][1])) {
      // scrolling x
      isScrollingX = true;
    }else {
      // scrolling y
      isScrollingY = true;
    }

    goog.array.find(this._scrollableElements, function(element,index) {
      if(goog.dom.contains(element.outerElement, e.target)) {
        if((element.isScrollXEnabled && isScrollingX === true) || (element.isScrollYEnabled && isScrollingY === true)) {
          element.onDown(e);
          e.stopPropagation();
          return true;
        }else {
          return false;
        }
      }else {
        return false;
      }
    }, this);

    // sim up event to remove event listeners
    this.onUp(e);
  }
};


reasons.fx.ScrollableElementManager.prototype.onUp = function(e) {
  this._scrollPoints = [];
  goog.events.unlisten(document, reasons.fx.ScrollableElementManager.EventType.MOVE, this.onMove, false, this);
  goog.events.unlisten(document, reasons.fx.ScrollableElementManager.EventType.UP, this.onUp, false, this);
};


reasons.fx.ScrollableElementManager.EventType = {
  DOWN: (goog.userAgent.MOBILE ? 'touchstart' : 'mousedown'),
  MOVE: (goog.userAgent.MOBILE ? 'touchmove' : 'mousemove'),
  UP: (goog.userAgent.MOBILE ? ['touchend', 'touchcancel'] : 'mouseup')
};


/**
 * @fileoverview A scrollable element which is composed of an outer and inner element.
 * The scroll value is returned by ZyngaScroller, and can be animated through multiple implementions
 * determined by user. By default, it uses scrollLeft/scrollTop to scroll
 */
goog.provide('reasons.fx.ScrollableElement');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.math');
goog.require('goog.userAgent.product');

/**
 * @constructor
 */
reasons.fx.ScrollableElement = function(outerElement, innerElement, options, implementation) {
  goog.base(this);

  this._options = options || {
    'scrollingX': true,
    'scrollingY': true
  };

  this.isScrollXEnabled = this._options['scrollingX'];
  this.isScrollYEnabled = this._options['scrollingY'];

  this.outerElement = outerElement;
  this.innerElement = innerElement;
  this._scroller = null;

  this._implementation = implementation || reasons.fx.ScrollableElement.Implementation.SCROLL;

  this.create();
};
goog.inherits(reasons.fx.ScrollableElement, goog.events.EventTarget);


reasons.fx.ScrollableElement.prototype.create = function() {
	var renderFunc;
	switch(this._implementation) {
		case reasons.fx.ScrollableElement.Implementation.CSS_POSITION:
		renderFunc = this.renderCSSPosition;
		break;

		case reasons.fx.ScrollableElement.Implementation.CSS_TRANSFORM:
		renderFunc = this.renderCSSTransform;
		break;

		case reasons.fx.ScrollableElement.Implementation.SCROLL:
		renderFunc = this.renderScroll;
		break;
	}

	this._scroller = new Scroller(goog.bind(renderFunc, this), this._options);

	this.setSize(goog.style.getSize(this.outerElement), goog.style.getSize(this.innerElement));

	// register this instance to manager
  reasons.fx.ScrollableElement.Manager.add(this);
};


reasons.fx.ScrollableElement.prototype.disposeInternal = function() {
	goog.base(this, 'disposeInternal');

	// unregister this instance to manager
  reasons.fx.ScrollableElement.Manager.remove(this);
};


reasons.fx.ScrollableElement.prototype.setSize = function(outerSize, innerSize) {
	this._scroller.setDimensions(outerSize.width, outerSize.height, innerSize.width, innerSize.height);
};


/**
 *	An optional render function by CSS left/top position
 */
reasons.fx.ScrollableElement.prototype.renderCSSPosition = function(left, top) {
	goog.style.setPosition(this.innerElement, -left, -top);
};


/**
 *	An optional render function by CSS transform
 */
reasons.fx.ScrollableElement.prototype.renderCSSTransform = function(left, top) {
	if(goog.userAgent.product.IPAD || goog.userAgent.product.IPHONE) {
		goog.style.setStyle(this.innerElement, 'transform', 'translate3d(' + -left + 'px, ' + -top + 'px, 0px)');
	}else {
		goog.style.setStyle(this.innerElement, 'transform', 'translate(' + -left + 'px, ' + -top + 'px)');
	}
};


/**
 *	An optional render function by scrollLeft/scrollTop
 */
reasons.fx.ScrollableElement.prototype.renderScroll = function(left, top) {
  this.outerElement.scrollLeft = left;
  this.outerElement.scrollTop = top;
};


/**
 *	Down Handler
 */
reasons.fx.ScrollableElement.prototype.onDown = function(e) {
	var ev = e.getBrowserEvent();
  var touches = goog.userAgent.MOBILE ? ev.touches : [{'pageX': ev.clientX, 'pageY': ev.clientY}];

  this._scroller.doTouchStart(touches, ev.timeStamp);

  goog.events.listen(document, reasons.fx.ScrollableElementManager.EventType.MOVE, this.onMove, false, this);
  goog.events.listen(document, reasons.fx.ScrollableElementManager.EventType.UP, this.onUp, false, this);
};


/**
 *	Move Handler
 */
reasons.fx.ScrollableElement.prototype.onMove = function(e) {
  var ev = e.getBrowserEvent();
  var touches = goog.userAgent.MOBILE ? ev.touches : [{'pageX': ev.clientX, 'pageY': ev.clientY}];

  this._scroller.doTouchMove(touches, ev.timeStamp);
};


/**
 *	Up Handler
 */
reasons.fx.ScrollableElement.prototype.onUp = function(e) {
  var ev = e.getBrowserEvent();
  this._scroller.doTouchEnd(ev.timeStamp);

  goog.events.unlisten(document, reasons.fx.ScrollableElementManager.EventType.MOVE, this.onMove, false, this);
  goog.events.unlisten(document, reasons.fx.ScrollableElementManager.EventType.UP, this.onUp, false, this);
};


reasons.fx.ScrollableElement.Manager = reasons.fx.ScrollableElementManager.getInstance();


reasons.fx.ScrollableElement.Implementation = {
	CSS_POSITION: 'css_position',
	CSS_TRANSFORM: 'css_transform',
	SCROLL: 'scroll'
};