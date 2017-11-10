
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

