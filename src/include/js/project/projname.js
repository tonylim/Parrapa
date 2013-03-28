/**
 * Core project class.
 * @constructor
 */

goog.provide('projname');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.EventTarget');
goog.require('goog.userAgent');

projname.VARS = {};

projname.ASSETS_URL = 'assets/';

/**
 * The main placeholder of assets
 */
projname.main = projname.Main.getInstance();

/**
 * initiate the site
 */
projname.init = function() {
  projname.main.init();
};


/**
 * Export getter & setters functions for possible use in the HTML
 */
goog.exportSymbol('projname', projname);
goog.exportProperty(projname, 'init', projname.init);