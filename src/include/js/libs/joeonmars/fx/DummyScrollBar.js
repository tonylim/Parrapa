/**
 * @fileoverview A singleton class managing all dummyscrollbars,
 * this is automatically created by instantiating the first DummyScrollBar by the user, 
 * thus should not be instantiated manually.
 *
 */
goog.provide('jomv3.fx.DummyScrollBarManager');

goog.require('goog.array');
goog.require('goog.events.EventType');
goog.require('goog.events.MouseWheelHandler');
goog.require('goog.dom');
goog.require('goog.dom.ViewportSizeMonitor');
goog.require('goog.userAgent');

/**
 * @constructor
 */
jomv3.fx.DummyScrollBarManager = function() {
  this._scrollBars = [];

  this._mouseWheelHandler = null;

  if(!goog.userAgent.isMobile) {
    this._mouseWheelHandler = new goog.events.MouseWheelHandler(document);
    goog.events.listen(this._mouseWheelHandler, goog.events.MouseWheelHandler.EventType.MOUSEWHEEL, this.onMouseWheel, false, this);
  }

  this._viewportSizeMonitor = new goog.dom.ViewportSizeMonitor();
  goog.events.listen(this._viewportSizeMonitor, goog.events.EventType.RESIZE, this.onResize, false, this);
};
goog.addSingletonGetter(jomv3.fx.DummyScrollBarManager);


jomv3.fx.DummyScrollBarManager.prototype.add = function(dummyScrollBar) {
  this._scrollBars.push(dummyScrollBar);

  // sort the scrollbars from innermost to outermost
  // this allows mousewheel handler to begin checking from the innermost element
  // in accordance to the order of event bubbling
  this._scrollBars.sort(function (a, b) {
  return goog.dom.contains(a.outerContent, b.outerContent) ? 1 :
         goog.dom.contains(b.outerContent, a.outerContent) ? -1 :
         0;
  });
};


jomv3.fx.DummyScrollBarManager.prototype.remove = function(dummyScrollBar) {
  goog.array.remove(this._scrollBars, dummyScrollBar);
};


jomv3.fx.DummyScrollBarManager.prototype.has = function(dummyScrollBar) {
  return goog.array.contains(this._scrollBars, dummyScrollBar);
};


/**
 * Return a Boolean of whether the specified scrollbar is animating,
 * or any scrollbar is dragging if no argument was passed
 */
jomv3.fx.DummyScrollBarManager.prototype.isAnimating = function(dummyScrollBar) {
  if(this.has(dummyScrollBar)) {
    return dummyScrollBar.isAnimating();
  }else {
    var scrollBar = goog.array.find(this._scrollBars, function(scrollBar) {
      return scrollBar.isAnimating();
    });

    return goog.isDefAndNotNull(scrollBar);
  }
};


/**
 * Return a Boolean of whether the specified scrollbar is dragging,
 * or any scrollbar is dragging if no argument was passed
 */
jomv3.fx.DummyScrollBarManager.prototype.isDragging = function(dummyScrollBar) {
  if(this.has(dummyScrollBar)) {
    return dummyScrollBar.isDragging();
  }else {
    var scrollBar = goog.array.find(this._scrollBars, function(scrollBar) {
      return scrollBar.isDragging();
    });

    return goog.isDefAndNotNull(scrollBar);
  }
};


/**
 * Return a Boolean of whether the specified scrollbar is scrolling,
 * or any scrollbar is dragging if no argument was passed
 */
jomv3.fx.DummyScrollBarManager.prototype.isScrolling = function(dummyScrollBar) {
  if(this.has(dummyScrollBar)) {
    return dummyScrollBar.isScrolling();
  }else {
    var scrollBar = goog.array.find(this._scrollBars, function(scrollBar) {
      return scrollBar.isScrolling();
    });

    return goog.isDefAndNotNull(scrollBar);
  }
};


jomv3.fx.DummyScrollBarManager.prototype.onMouseWheel = function(e) {
  goog.array.find(this._scrollBars, function(scrollBar) {
    if(goog.dom.contains(scrollBar.outerContent, e.target)) {
      // skip and keep bubbling if cannot scroll further
      if(!scrollBar.canScrollFurther(-e.detail)) {
        return false;
      }
      // if mousewheel on the content, scroll all scrollbars associated with this content
      goog.array.forEach(this._scrollBars, function(bar) {
        if(bar.outerContent === scrollBar.outerContent) {
          bar.onMouseWheel(e);
        }
      });
      e.stopPropagation();
      return true;
    }else if(goog.dom.contains(scrollBar.domElement, e.target)) {
      // skip and keep bubbling if cannot scroll further
      if(!scrollBar.canScrollFurther(-e.detail)) {
        return false;
      }
      // if mousewheel on the scroll bar, only scroll the scroll bar
      scrollBar.onMouseWheel(e);
      e.stopPropagation();
      return true;
    }else {
      // continue to find next target
      return false;
    }
  }, this);
};


jomv3.fx.DummyScrollBarManager.prototype.onResize = function(e) {
  goog.array.find(this._scrollBars, function(scrollBar) {
    scrollBar.onResize(e);
  });
};




/**
 * @fileoverview A dummy scrollbar hooked up with the default scrollbar.
 * Always change the scrollLeft property of a dom element in favor of higher performance than css positions/transforms
 *
 */
goog.provide('jomv3.fx.DummyScrollBar');

goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.events.EventTarget');
goog.require('goog.events.MouseWheelHandler');
goog.require('goog.fx.anim');
goog.require('goog.fx.Dragger');
goog.require('goog.math.Size');
goog.require('goog.math.Rect');
goog.require('goog.style');

/**
 * @constructor
 * @param options = {
      sliderWidth: number|string,
      sliderHeight: number|string,
      outerLength: number,
      innerLength: number,
      layout: string,
      ease: number,
      easeWhenMouseWheel: boolean,
      easeWhenJump: boolean,
      useDefaultSkin: boolean,
      onDragStartCallback: function,
      onDragCallback: function,
      onDragEndCallback: function,
      onMouseWheelCallback: function,
      onActiveScrollCallback: function,
    }
 */
jomv3.fx.DummyScrollBar = function(outerContent, innerContent, container, direction, options) {
  goog.base(this);

  var options = options || {};
  options.useDefaultSkin = (options.useDefaultSkin !== false);

  this.outerContent = outerContent;
  this.innerContent = innerContent;

  this._userOuterLength = options.outerLength;
  this._userInnerLength = options.innerLength;

  this.direction = direction;

  this._animProps = {ease: (options.ease || .4), end:0, last:0, current:0, scrollProp:''};
  this._easeWhenMouseWheel = options.easeWhenMouseWheel || false;
  this._easeWhenJump = options.easeWhenJump || false;

  this._isAnimating = false;

  this._onMouseWheelCallback = options.onMouseWheelCallback;
  this._onDragStartCallback = options.onDragStartCallback;
  this._onDragCallback = options.onDragCallback;
  this._onDragEndCallback = options.onDragEndCallback;
  this._onActiveScrollCallback = options.onActiveScrollCallback;

  // set layout position, and optionally fallback
  // to default layout position:
  // right for vertical direction, bottom for horizontal direction
  this.layout = options.layout || ((this.direction === jomv3.fx.DummyScrollBar.Direction.HORIZONTAL) ? jomv3.fx.DummyScrollBar.Layout.BOTTOM : jomv3.fx.DummyScrollBar.Layout.RIGHT);

  this.isHorizontalLayout = (this.layout === jomv3.fx.DummyScrollBar.Layout.TOP || this.layout === jomv3.fx.DummyScrollBar.Layout.BOTTOM);
  this.isVerticalLayout = (this.layout === jomv3.fx.DummyScrollBar.Layout.LEFT || this.layout === jomv3.fx.DummyScrollBar.Layout.RIGHT);

  var cssTop = (this.layout !== jomv3.fx.DummyScrollBar.Layout.BOTTOM) ? '0' : 'auto';
  var cssBottom = (this.layout === jomv3.fx.DummyScrollBar.Layout.BOTTOM) ? '0' : 'auto';
  var cssLeft = (this.layout === jomv3.fx.DummyScrollBar.Layout.LEFT) ? '0' : 'auto';
  var cssRight = (this.layout === jomv3.fx.DummyScrollBar.Layout.RIGHT) ? '0' : 'auto';

  // construct dom
  this.domElement = goog.dom.createDom('div', 'scrollBar', [
    this.slider = goog.dom.createDom('div', 'slider'),
    this.handle = goog.dom.createDom('div', 'handle')
    ]);

  // parse width from options
  var scrollBarW;
  if(goog.isNumber(options.sliderWidth)) {
    scrollBarW = options.sliderWidth + 'px';
  }else {
    scrollBarW = options.sliderWidth || (this.isHorizontalLayout ? '100%' : 'auto');
  }

  // parse height from options
  var scrollBarH;
  if(goog.isNumber(options.sliderHeight)) {
    scrollBarH = options.sliderHeight + 'px';
  }else {
    scrollBarH = options.sliderHeight || (this.isVerticalLayout ? '100%' : 'auto');
  }

  // stretch handle's width or height to fit slider, based on direction
  var handleW = this.isHorizontalLayout ? 'auto' : '100%';
  var handleH = this.isVerticalLayout ? 'auto' : '100%';

  // stylize dom
  goog.style.setStyle(this.domElement, {
    'position': 'absolute',
    'width': scrollBarW,
    'height': scrollBarH,
    'left': cssLeft,
    'top': cssTop,
    'bottom': cssBottom,
    'right': cssRight
  });

  goog.style.setStyle(this.slider, {
    'position': 'absolute',
    'width': '100%',
    'height': '100%'
  });

  goog.style.setStyle(this.handle, {
    'position': 'absolute',
    'width': handleW,
    'height': handleH
  });

  if(options.useDefaultSkin === true) {
    goog.style.setStyle(this.domElement, {'outline': '1px solid green', 'background': 'rgba(0, 255, 0, .3)'});
    goog.style.setStyle(this.handle, {'background': 'rgba(255, 0, 0, .5)'});
  }

  // prevent the position:abolute contents in innerContent from staying fixed in
  // as the innerContent scrolls
  goog.style.setStyle(this.innerContent, 'position', 'relative');
  // hide the native scroll bar for outerContent
  goog.style.setStyle(this.outerContent, 'overflow', 'hidden');

  // attach dom
  goog.dom.appendChild(container, this.domElement);

  // create dragger
  this.dragger = new goog.fx.Dragger(this.handle);

  // initial resize
  this._outerSize = null;
  this._innerSize = null;
  this._scrollBarSize = null;
  this._handleSize = null;
  this._sliderSize = null;
  this._dragRect = new goog.math.Rect(0, 0, 0, 0);

  this.onResize();

  // add event listener
  goog.events.listen(this.outerContent, goog.events.EventType.SCROLL, this.onScroll, false, this);
  goog.events.listen(this.dragger, goog.fx.Dragger.EventType.START, this.onDragStart, false, this);
  goog.events.listen(this.dragger, goog.fx.Dragger.EventType.DRAG, this.onDrag, false, this);
  goog.events.listen(this.dragger, goog.fx.Dragger.EventType.END, this.onDragEnd, false, this);
  goog.events.listen(this.slider, ['mousedown', 'touchstart'], this.onDownSlider, false, this);

  // register the scrollbar to manager
  jomv3.fx.DummyScrollBar.Manager.add(this);
};
goog.inherits(jomv3.fx.DummyScrollBar, goog.events.EventTarget);


jomv3.fx.DummyScrollBar.prototype.disposeInternal = function() {
  goog.base(this, 'disposeInternal');

  this.stopAnimating();

  this.dragger.dispose();

  // unregister the scrollbar to manager
  jomv3.fx.DummyScrollBar.Manager.remove(this);
};


jomv3.fx.DummyScrollBar.prototype.isAnimating = function() {
  return this._isAnimating;
};


jomv3.fx.DummyScrollBar.prototype.isDragging = function() {
  return this.dragger.isDragging();
};


jomv3.fx.DummyScrollBar.prototype.isScrolling = function() {
  return (this.dragger.isDragging() || this.isAnimating());
};


/**
 * Determines whether the scroller had hit the end along a given direction
 */
jomv3.fx.DummyScrollBar.prototype.canScrollFurther = function(delta) {
  // normalize direction to 1 or -1
  var dir = delta/Math.abs(delta);

  if(this.direction === jomv3.fx.DummyScrollBar.Direction.HORIZONTAL) {
    if(dir === -1) {
      // scroll right
      return (this.outerContent.scrollLeft < this.outerContent.scrollWidth - this.outerContent.offsetWidth);
    }else {
      // scroll left
      return (this.outerContent.scrollLeft > 0);
    }
  }else {
    if(dir === -1) {
      // scroll down
      return (this.outerContent.scrollTop < this.outerContent.scrollHeight - this.outerContent.offsetHeight);
    }else {
      // scroll up
      return (this.outerContent.scrollTop > 0);
    }
  }
};


jomv3.fx.DummyScrollBar.prototype.stopAnimating = function() {
  goog.fx.anim.unregisterAnimation(this);
  this._isAnimating = false;
};


jomv3.fx.DummyScrollBar.prototype.setDimensions = function(newUserOuterLength, newUserInnerLength) {
  this._userOuterLength = newUserOuterLength;
  this._userInnerLength = newUserInnerLength;

  var outerLength = this._userOuterLength || ((this.direction === jomv3.fx.DummyScrollBar.Direction.HORIZONTAL) ? this._outerSize.width : this._outerSize.height);
  var innerLength = this._userInnerLength || ((this.direction === jomv3.fx.DummyScrollBar.Direction.HORIZONTAL) ? this._innerSize.width : this._innerSize.height);

  var handleLength = outerLength / innerLength * 100 + '%';

  if(this.layout === jomv3.fx.DummyScrollBar.Layout.TOP || this.layout === jomv3.fx.DummyScrollBar.Layout.BOTTOM) {
    // reset horizontal dimension
    goog.style.setStyle(this.handle, 'width', handleLength);
  }else {
    // reset vertical dimension
    goog.style.setStyle(this.handle, 'height', handleLength);
  }
};


jomv3.fx.DummyScrollBar.prototype.scrollTo = function(scrollPosition, animate) {
  if(animate === true) {

    this._animProps.end = scrollPosition;

    if(this.direction === jomv3.fx.DummyScrollBar.Direction.HORIZONTAL) {
      this._animProps.scrollProp = 'scrollLeft';
      this._animProps.last = this.outerContent.scrollLeft;
      this._animProps.current = this._animProps.last;
    }else {
      this._animProps.scrollProp = 'scrollTop';
      this._animProps.last = this.outerContent.scrollTop;
      this._animProps.current = this._animProps.last;
    }

    goog.fx.anim.registerAnimation(this);
    this.onAnimationFrame();

  }else {

    if(this.direction === jomv3.fx.DummyScrollBar.Direction.HORIZONTAL) {
      this.outerContent.scrollLeft = scrollPosition;
    }else {
      this.outerContent.scrollTop = scrollPosition;
    }

  }
};


jomv3.fx.DummyScrollBar.prototype.scrollBy = function(delta, animate) {
  if(animate === true) {

    if(this.direction === jomv3.fx.DummyScrollBar.Direction.HORIZONTAL) {
      this._animProps.scrollProp = 'scrollLeft';
      this._animProps.end = this.outerContent.scrollLeft + delta;
      this._animProps.last = this.outerContent.scrollLeft;
      this._animProps.current = this._animProps.last;
    }else {
      this._animProps.scrollProp = 'scrollTop';
      this._animProps.end = this.outerContent.scrollTop + delta;
      this._animProps.last = this.outerContent.scrollTop;
      this._animProps.current = this._animProps.last;
    }

    goog.fx.anim.registerAnimation(this);
    this.onAnimationFrame();

  }else {

    if(this.direction === jomv3.fx.DummyScrollBar.Direction.HORIZONTAL) {
      this.outerContent.scrollLeft += delta;console.log(this.outerContent.scrollLeft,this.outerContent.scrollWidth-goog.dom.getViewportSize().width)
      return this.outerContent.scrollLeft;
    }else {
      this.outerContent.scrollTop += delta;
      return this.outerContent.scrollTop;
    }

  }
};


jomv3.fx.DummyScrollBar.prototype.onDragStart = function(e) {
  goog.dom.classes.add(this.handle, 'down');

  if(this._onDragStartCallback) {
    this._onDragStartCallback.call();
  }

  if(this._onActiveScrollCallback) {
    this._onActiveScrollCallback.call();
  }
};


jomv3.fx.DummyScrollBar.prototype.onDragEnd = function(e) {
  goog.dom.classes.remove(this.handle, 'down');

  if(this._onDragEndCallback) {
    this._onDragEndCallback.call();
  }
};


jomv3.fx.DummyScrollBar.prototype.onDrag = function(e) {
  var innerContentLength;
  if(this.direction === jomv3.fx.DummyScrollBar.Direction.HORIZONTAL) {
    innerContentLength = this._innerSize.width;
  }else {
    innerContentLength = this._innerSize.height;
  }

  var scrollPosition;
  if(this.isHorizontalLayout) {
    scrollPosition = innerContentLength * (e.left / this._sliderSize.width);
  }else {
    scrollPosition = innerContentLength * (e.top / this._sliderSize.height);
  }

  if(this.direction === jomv3.fx.DummyScrollBar.Direction.HORIZONTAL) {
    this.outerContent.scrollLeft = scrollPosition;
  }else {
    this.outerContent.scrollTop = scrollPosition;
  }

  // external callback
  if(this._onDragCallback) {
    this._onDragCallback.call();
  }

  if(this._onActiveScrollCallback) {
    this._onActiveScrollCallback.call();
  }
};


jomv3.fx.DummyScrollBar.prototype.onDownSlider = function(e) {
  var offset;

  if(e.type === 'touchstart') {
    var ev = e.getBrowserEvent();
    if(this.isHorizontalLayout) {
      offset = ev['touches'][0].pageX - goog.style.getPageOffsetLeft(this.slider);
    }else {
      offset = ev['touches'][0].pageY - goog.style.getPageOffsetTop(this.slider);
    }
  }else if(e.type === 'mousedown') {
    if(this.isHorizontalLayout) {
      offset = e.offsetX;
    }else {
      offset = e.offsetY;
    }
  }

  var scrollPosition;
  var innerContentLength;

  if(this.direction === jomv3.fx.DummyScrollBar.Direction.HORIZONTAL) {
    innerContentLength = this._innerSize.width;
  }else {
    innerContentLength = this._innerSize.height;
  }

  if(this.isHorizontalLayout) {
    scrollPosition = offset / this._sliderSize.width * innerContentLength;
  }else {
    scrollPosition = offset / this._sliderSize.height * innerContentLength;
  }

  this.scrollTo(scrollPosition, this._easeWhenJump);

  // external callback
  if(this._onActiveScrollCallback) {
    this._onActiveScrollCallback.call();
  }
};


jomv3.fx.DummyScrollBar.prototype.onScroll = function(e) {
  if(this.isDragging()) return;

  var innerContentLength;
  if(this.direction === jomv3.fx.DummyScrollBar.Direction.HORIZONTAL) {
    innerContentLength = this._innerSize.width;
  }else {
    innerContentLength = this._innerSize.height;
  }

  var scrollPosition;
  var handlePosition;

  if(this.direction === jomv3.fx.DummyScrollBar.Direction.HORIZONTAL) {
    scrollPosition = this.outerContent.scrollLeft;
  }else {
    scrollPosition = this.outerContent.scrollTop;
  }

  if(this.isHorizontalLayout) {
    handlePosition = this._sliderSize.width * (scrollPosition / innerContentLength);
    goog.style.setPosition(this.handle, handlePosition, 0);
  }else {
    handlePosition = this._sliderSize.height * (scrollPosition / innerContentLength);
    goog.style.setPosition(this.handle, 0, handlePosition);
  }
};


jomv3.fx.DummyScrollBar.prototype.onMouseWheel = function(e) {
  this.stopAnimating();

  var ev = e.getBrowserEvent();
  var delta = 0;

  if(ev.wheelDelta) delta = ev.wheelDelta/120;
  if(ev.detail) delta = - ev.detail/3;

  var steps;

  if(this.direction === jomv3.fx.DummyScrollBar.Direction.HORIZONTAL) {
    steps = this._innerSize.width / 100;
  }else {
    steps = this._innerSize.height / 100;
  }

  this.scrollBy(-delta * steps, this._easeWhenMouseWheel);

  // external callback
  if(this._onMouseWheelCallback) {
    this._onMouseWheelCallback.call();
  }

  if(this._onActiveScrollCallback) {
    this._onActiveScrollCallback.call();
  }
};


jomv3.fx.DummyScrollBar.prototype.onAnimationFrame = function(now) {
  this._isAnimating = true;

  var delta = (this._animProps.end - this.outerContent[this._animProps.scrollProp]) * this._animProps.ease;
  var scrollPosition = this.scrollBy(delta);

  if(Math.abs(scrollPosition - this._animProps.last) < 1) {
    this.stopAnimating();
  }

  this._animProps.last = scrollPosition;

  // external callback
  if(this._onActiveScrollCallback) {
    this._onActiveScrollCallback.call();
  }
};


jomv3.fx.DummyScrollBar.prototype.onResize = function(e) {
  this._outerSize = goog.style.getSize(this.outerContent);
  this._innerSize = goog.style.getSize(this.innerContent);

  this.setDimensions();

  this._scrollBarSize = goog.style.getSize(this.domElement);
  this._sliderSize = goog.style.getSize(this.slider);
  this._handleSize = goog.style.getSize(this.handle);

  if(this.isHorizontalLayout) {
    this._dragRect.width = this._scrollBarSize.width - this._handleSize.width;
  }else {
    this._dragRect.height = this._scrollBarSize.height - this._handleSize.height;
  }

  this.dragger.setLimits(this._dragRect);

  this.onScroll();
};


jomv3.fx.DummyScrollBar.Manager = jomv3.fx.DummyScrollBarManager.getInstance();


jomv3.fx.DummyScrollBar.Direction = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
};


jomv3.fx.DummyScrollBar.Layout = {
  TOP: 'top',
  BOTTOM: 'bottom',
  LEFT: 'left',
  RIGHT: 'right'
};