import test       from 'ava';
var    sg         = require('../../sg');

test('_extend() works', function(t) {
  const x = {foo:'bar'};

  const result = sg._extend(x, {baz:42});

  t.deepEqual(result, {foo:'bar', baz:42});
});

test('_extend() does not copy undefined values', function(t) {
  (function(undefined) {
    const x = {undef: undefined};

    const result = sg._extend({}, x);
    t.deepEqual(result, {});
  }());
});

