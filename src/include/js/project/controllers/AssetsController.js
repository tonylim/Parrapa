goog.provide('projname.controllers.AssetsController');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.events.EventTarget');
goog.require('goog.events');
goog.require('goog.History');
goog.require('goog.object');

/**
 * @constructor
 */
 
projname.controllers.AssetsController = function(){
  goog.base(this);

  this.domains = {};
  this.addDomain('settings');
  this.addDomain('ui');
};
goog.inherits(projname.controllers.AssetsController, goog.events.EventTarget);
goog.addSingletonGetter(projname.controllers.AssetsController);


projname.controllers.AssetsController.prototype.addDomain = function(domainName){
  if(this.domains[domainName]) console.log("Warning: Domain of the given name already exist.");
  else this.domains[domainName] = {};
};


projname.controllers.AssetsController.prototype.validateDomain = function(domainName){
  var domain = this.domains[domainName];
  if(!domain) throw("Error: Assets domain isn't provided.");
  else return domain;
};


projname.controllers.AssetsController.prototype.createAssetsLoader = function(manifest, domainName){
  var domain = this.validateDomain(domainName);

  // create a loader queue
  var loaderQueue = new createjs.LoadQueue(true);

  var onFileLoad = function(e) {
    var assetId = e.item.id;
    var assetResult = e.result;
    domain[assetId] = assetResult;
  };

  var onComplete = function(e) {
    loaderQueue.removeEventListener("fileload", onFileLoad);
    loaderQueue.removeEventListener("complete", onComplete);
  };

  loaderQueue.addEventListener("fileload", onFileLoad);
  loaderQueue.addEventListener("complete", onComplete);

  loaderQueue.loadManifest(manifest);

  return loaderQueue;
};


projname.controllers.AssetsController.prototype.getAssetById = function(assetId, domainName){
  var domain = this.validateDomain(domainName);
  return domain[assetId];
};