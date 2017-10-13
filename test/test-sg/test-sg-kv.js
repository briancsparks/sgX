import test       from 'ava';
var    sg         = require('../../sg');

test('kv works', function(t) {
  const result  = sg.kv('foo', 'bar');

  t.deepEqual(result, {foo:'bar'});
});

test('ap works', function(t) {
  const result  = sg.ap('foo');

  t.deepEqual(result, ['foo']);
});

test('anyIsnt works', function(t) {
  const result = sg.anyIsnt(['a', null, 'b']);

  t.true(result);
});

test('anyIsnt is not fooled by falsy', function(t) {
  const result = sg.anyIsnt(['a', 0, 'b']);

  t.false(result);
});

