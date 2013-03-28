// This file was automatically generated from components.soy.
// Please don't edit this file by hand.

goog.provide('projname.templates.components');

goog.require('soy');
goog.require('soydata');


projname.templates.components.helloWorld = function(opt_data, opt_ignored) {
  return 'Hello world!';
};


projname.templates.components.helloName = function(opt_data, opt_ignored) {
  return (! opt_data.greetingWord) ? 'Hello ' + soy.$$escapeHtml(opt_data.name) + '!' : soy.$$escapeHtml(opt_data.greetingWord) + ' ' + soy.$$escapeHtml(opt_data.name) + '!';
};


projname.templates.components.helloNames = function(opt_data, opt_ignored) {
  var output = projname.templates.components.helloName(opt_data) + '<br>';
  var additionalNameList18 = opt_data.additionalNames;
  var additionalNameListLen18 = additionalNameList18.length;
  if (additionalNameListLen18 > 0) {
    for (var additionalNameIndex18 = 0; additionalNameIndex18 < additionalNameListLen18; additionalNameIndex18++) {
      var additionalNameData18 = additionalNameList18[additionalNameIndex18];
      output += projname.templates.components.helloName({name: additionalNameData18}) + ((! (additionalNameIndex18 == additionalNameListLen18 - 1)) ? '<br>' : '');
    }
  } else {
    output += 'No additional people to greet.';
  }
  return output;
};


projname.templates.components.button = function(opt_data, opt_ignored) {
  return '<button class="button" data-id=' + soy.$$escapeHtml(opt_data.buttonId) + '>' + soy.$$escapeHtml(opt_data.buttonText) + '</button>';
};
