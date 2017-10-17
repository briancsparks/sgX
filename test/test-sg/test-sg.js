
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

