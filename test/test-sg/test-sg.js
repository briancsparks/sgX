
import test       from 'ava';
var    sg         = require('../../sg');
var    _          = sg._;

test('deep equal works', function(t) {
  var isEqual = sg.deepEqual({
    foo: 'bar',
    baz: {
      ar: [],
      ar2: [1,'two',3.1,{}]
    }
  },{
    foo: 'bar',
    baz: {
      ar: [],
      ar2: [1,'two',3.1,{}]
    }
  });

  t.true(isEqual);
});

test('not deep equal works', function(t) {
  var isEqual = sg.deepEqual({
    foo: 'bar',
    baz: {
      ar: [],
      ar2: [1,'two',3.1,{},false]
    }
  },{
    foo: 'bar',
    baz: {
      ar: [],
      ar2: [1,'two',3.1,{}]
    }
  });

  t.false(isEqual);
});

test('pad works', t => {
  t.is(sg.pad('a', 3), '  a');
});

test('pad does not truncate', t => {
  t.is(sg.pad('abcdefg', 3), 'abcdefg');
});

test('pad works for numbers', t => {
  t.is(sg.pad(4, 3), '004');
});

test('pad works for decimal numbers', t => {
  t.is(sg.pad(5925 / 1000, 7), '005.925');
});

test('pad works for numbers with space padding', t => {
  t.is(sg.pad(4242 / 1000, 7, ' '), '  4.242');
});

test('pad works for numbers with non-zero padding', t => {
  t.is(sg.pad(4242 / 1000, 7, 'x'), 'xx4.242');
});

test('pad does not remove zeros', t => {
  t.is(sg.pad(200, 5), '00200');
});

test('pad works for negative numbers', t => {
  t.is(sg.pad(-1, 3), ' -1');
});

test('lpad works', t => {
  t.is(sg.lpad('a', 3), 'a  ');
});

test('lpad does not truncate', t => {
  t.is(sg.lpad('abcdefg', 3), 'abcdefg');
});

test('lpad works for numbers', t => {
  t.is(sg.lpad(4, 3), '4  ');
});

test('lpad works for decimal numbers', t => {
  t.is(sg.lpad(5925 / 1000, 7), '5.925  ');
});

test('lpad works for numbers with non-zero padding', t => {
  t.is(sg.lpad(4242 / 1000, 7, 'x'), '4.242xx');
});

test('lpad does not remove zeros', t => {
  t.is(sg.lpad(200, 5), '200  ');
});

