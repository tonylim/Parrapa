goog.provide('projname.views.Panel');

goog.require('goog.dom');
goog.require('projname.templates.components');

/**
 * @constructor
 */
projname.views.Panel = function() {
  goog.base(this);
};
goog.inherits(projname.views.Panel, goog.events.EventTarget);


projname.views.Panel.prototype.init = function() {
	goog.events.listen(this, 'hello', this.onHello);

	this.dispatchEvent('hello');

	/*
	for(var i=0; i < 10; i++) {
		var frag = soy.renderAsFragment(projname.templates.components.button, {buttonText:'button-'+i, buttonId:'id-'+i});
		document.body.appendChild(frag);
	}
	*/
};


/**
 * when receive hello event, execute the following lines
 */
projname.views.Panel.prototype.onHello = function() {
	console.log('hello');

	// create a drag points test
	var container = goog.dom.getElement("container");
  var img = goog.dom.getElementByClass('img');console.log(img)
  var pts = goog.dom.getElementsByClass('pt');
  var tl = goog.dom.getElementByClass('tl');
  var tr = goog.dom.getElementByClass('tr');
  var bl = goog.dom.getElementByClass('bl');
  var br = goog.dom.getElementByClass('br');
  var IMG_WIDTH = 512;
  var IMG_HEIGHT = 512;

  var transform = new PerspectiveTransform(img, IMG_WIDTH, IMG_HEIGHT, true);
  goog.style.setPosition(tl, transform.topLeft.x, transform.topLeft.y);
  goog.style.setPosition(tr, transform.topRight.x, transform.topRight.y);
  goog.style.setPosition(bl, transform.bottomLeft.x, transform.bottomLeft.y);
  goog.style.setPosition(br, transform.bottomRight.x, transform.bottomRight.y);

  // add mouse events to pts
  var target;
  var targetPoint;

  goog.array.forEach(pts, function(pt, index) {
  	goog.events.listen(pt, 'mousedown', function(e) {
  		target = pt;console.log(pt,tl)
  		switch(pt) {
  			case tl:
  				targetPoint = transform.topLeft;
  				break;

  			case tr:
  				targetPoint = transform.topRight;
  				break;

  			case bl:
  				targetPoint = transform.bottomLeft;
  				break;

  			case br:
  				targetPoint = transform.bottomRight;
  				break;
  		}
  	}, false, this);
  }, this);
//research this section for the closure api equivalence of jquery api container.offset().left/top
  goog.events.listen(window, 'mousemove', function(e) {
  	if(!targetPoint) return;
  		var containerLeft = container.pageXOffset;
  		var containerTop = container.pageYOffset;
      targetPoint.x = e.pageX - containerLeft - 20;
      targetPoint.y = e.pageY - containerTop - 20;
      goog.style.setPosition(target, targetPoint.x, targetPoint.y);
      
      // check the polygon error, if it's 0, which mean there is no error
      if(transform.checkError()==0){
          transform.update();
          goog.style.showElement(img, true);
      }else{
          goog.style.showElement(img, false);
      }
  }, false, this);

  goog.events.listen(window, 'mouseup', function(e) {

  }, false, this);

};