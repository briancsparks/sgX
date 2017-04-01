
/**
 *
 */
var test              = require('ava');

var sg    = require('../../sg');

test('Deep extend recurses', function(t) {
  var x = {a:1, b:{c:2,d:'33'}};
  var y = {a:9, b:{c:8,d:'99'}};

  var z = sg.extend(x, y);

  // z should be the result
  t.deepEqual(z, {a:9, b:{c:8,d:'99'}});

  // x and y should not be changed
  t.deepEqual(x, {a:1, b:{c:2,d:'33'}});
  t.deepEqual(y, {a:9, b:{c:8,d:'99'}});
});

test('Deep extend handles different sized objects', function(t) {
  var x = {a:1, b:{c:2,d:'33',e:'fg'}};
  var y = {a:9, b:{c:8,d:'99'}};

  var z = sg.extend(x, y);

  // z should be the result
  t.deepEqual(z, {a:9, b:{c:8,d:'99',e:'fg'}});

  // x and y should not be changed
  t.deepEqual(x, {a:1, b:{c:2,d:'33',e:'fg'}});
  t.deepEqual(y, {a:9, b:{c:8,d:'99'}});
});

test('Deep extend handles different sized objects2', function(t) {
  var x = {a:1, b:{c:2,d:'33'}};
  var y = {a:9, b:{c:8,d:'99'},foo:'bar'};

  var z = sg.extend(x, y);

  // z should be the result
  t.deepEqual(z, {a:9, b:{c:8,d:'99'},foo:'bar'});

  // x and y should not be changed
  t.deepEqual(x, {a:1, b:{c:2,d:'33'}});
  t.deepEqual(y, {a:9, b:{c:8,d:'99'},foo:'bar'});
});

test('Deep extend handles an object replacing a POD', function(t) {
  var x = {a:1, b:{c:2,d:'33',e:'fg'}};
  var y = {a:9, b:{    d:'99',e:{k:'v'}}};

  var z = sg.extend(x, y);

  // z should be the result
  t.deepEqual(z, {a:9, b:{c:2,d:'99',e:{k:'v'}}});

  // x and y should not be changed
  t.deepEqual(x, {a:1, b:{c:2,d:'33',e:'fg'}});
  t.deepEqual(y, {a:9, b:{    d:'99',e:{k:'v'}}});
});

test('Deep extend handles a POD replacing an object', function(t) {
  var x = {a:1, b:{c:2,d:'33',e:'fg'},h:{i:10}};
  var y = {a:9, b:{    d:'99'},       h:'foobar'};

  var z = sg.extend(x, y);

  // z should be the result
  t.deepEqual(z, {a:9, b:{c:2,d:'99',e:'fg'},h:'foobar'});

  // x and y should not be changed
  t.deepEqual(x, {a:1, b:{c:2,d:'33',e:'fg'},h:{i:10}});
  t.deepEqual(y, {a:9, b:{    d:'99'},       h:'foobar'});
})
