
/**
 *  Test how an external module would require sg sub-modules.
 */

var test          = require('ava');

test('Can require sg/lite', function(t) {
  var sg = require('sgsg/lite');
  t.is(typeof sg.isDebug, 'function');
  t.is(typeof sg.firstKey, 'function');

  var realsg = require('sgsg');
  t.is(typeof realsg.isDebug, 'function');
  t.is(typeof realsg.firstKey, 'function');
});

test('Can still require sg', function(t) {
  var sg = require('sgsg');
  t.is(typeof sg.iAmStillHere, 'function');
});

test('Can require sg/flow', function(t) {
  var sg = require('sgsg/flow');
  t.is(typeof sg.reason, 'function');
  t.is(typeof sg.__each, 'function');
  t.is(typeof sg.__eachll, 'function');
  t.is(typeof sg.__runll, 'function');

  var realsg = require('sgsg');
  t.is(typeof realsg.reason, 'function');
  t.is(typeof realsg.__each, 'function');
  t.is(typeof realsg.__eachll, 'function');
  t.is(typeof realsg.__runll, 'function');
});

