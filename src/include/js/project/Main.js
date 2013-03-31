goog.provide('projname.Main');

goog.require('goog.dom');
goog.require('goog.userAgent');
goog.require('projname.templates.components');
goog.require('projname.views.Panel');

/**
 * @constructor
 */
projname.Main = function() {
  goog.base(this);
  //
};
goog.inherits(projname.Main, goog.events.EventTarget);
goog.addSingletonGetter(projname.Main);


projname.Main.prototype.init = function() {
	var helloWorldFrag = soy.renderAsFragment(projname.templates.components.helloNames, {
		name: 'Ana',
		additionalNames: ['Bob', 'Cid', 'Dee']
	});
	
	document.body.appendChild(helloWorldFrag);

	// test
	var panel = new projname.views.Panel();
	panel.init();
};


projname.Main.controllers = {

};