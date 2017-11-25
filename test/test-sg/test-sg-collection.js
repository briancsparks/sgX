
import test       from 'ava';
var    sg         = require('../../sg');

test('pad(): pads zeros', function(t) {
  var s = "1";

  s = sg.pad(s, 3, '0');

  t.is(s, '001');
});

var orig = [
  {a:'a1', b:'b1', c:{ic:'c1'}},
  {a:'a2', b:'b2', c:{ic:'c2', id:'d2'}},
  {a:'a3', b:'b3', c:{ic:'c3',  a:'ia3'}},
  {a:'a4', b:'b4'}
];

var promoted = [
  {ic:'c1',           a:'a1', b:'b1'},
  {ic:'c2', id:'d2',  a:'a2', b:'b2'},
  {ic:'c3',  a:'ia3',         b:'b3'},
  {                   a:'a4', b:'b4'}
];

test('promote', function(t) {
  const result = sg.promote(orig, 'c');
  t.deepEqual(result, promoted);
});

var orig2 = [
  {a:'a1', b:'b1', c:[{ic:'c1'}, {ic:'c2'}]}
];

var promoted2 = [
  {ic:'c1',           a:'a1', b:'b1'},
  {ic:'c2',           a:'a1', b:'b1'},
];

test('promote2', function(t) {
  const result = sg.promote(orig2, 'c');
  t.deepEqual(result, promoted2);
});

var insideOut = [
  {ic:'c1',           c:{a:'a1', b:'b1'}},
  {ic:'c2', id:'d2',  c:{a:'a2', b:'b2'}},
  {ic:'c3',  a:'ia3', c:{a:'a3', b:'b3'}},
  {                   c:{a:'a4', b:'b4'}}
];

test('insideOut', function(t) {
  const result = sg.insideOut(orig ,'c');
  t.deepEqual(result, insideOut);
});

