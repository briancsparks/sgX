import test       from 'ava';
var    sg         = require('../../sg');

const fbb     = {foo:{bar:{baz:42}}};
const fbba    = {foo:{bar:{baz:[42]}}};

//----------------------------------------------------------------------------------------------
// sg.kv()

test('kv works', function(t) {
  const result  = sg.kv('foo', 'bar');

  t.deepEqual(result, {foo:'bar'});
});

//----------------------------------------------------------------------------------------------
// sg.ap()

test('ap works', function(t) {
  const result  = sg.ap('foo');

  t.deepEqual(result, ['foo']);
});

//----------------------------------------------------------------------------------------------
// sg.isnt()

test('isnt works', function(t) {
  const result = sg.isnt(null);

  t.true(result);
});

//----------------------------------------------------------------------------------------------
// sg.anyIsnt()

test('anyIsnt works', function(t) {
  const result = sg.anyIsnt(['a', null, 'b']);

  t.true(result);
});

test('anyIsnt is not fooled by falsy', function(t) {
  const result = sg.anyIsnt(['a', 0, 'b']);

  t.false(result);
});

//----------------------------------------------------------------------------------------------
// sg.deref()

test('deref works', function(t) {
  const result = sg.deref(fbb, 'foo.bar.baz');

  t.is(result, 42);
});

test('deref knows array indexing', function(t) {
  const result = sg.deref(fbb, ['foo', 'bar', 'baz']);

  t.is(result, 42);
});

test('deref handles null/undefined object', function(t) {
  const result = sg.deref(null, ['foo', 'bar', 'baz']);

  t.is(result, undefined);
});

test('deref handles null/undefined index', function(t) {
  const result = sg.deref(fbb, null);

  t.is(result, undefined);
});

test('deref handles null/undefined index part', function(t) {
  const result = sg.deref(fbb, ['foo', null, 'baz']);

  t.is(result, undefined);
});

//----------------------------------------------------------------------------------------------
// sg.setOnn()

test('setOnn works', function(t) {
  var   resultObj = {};

  const result = sg.setOnn(resultObj, 'foo.bar.baz', 42);

  t.is(result, 42);
  t.deepEqual(resultObj, fbb);
});

test('setOnn knows array indexing', function(t) {
  var resultObj = {};

  const result = sg.setOnn(resultObj, ['foo', 'bar', 'baz'], 42);

  t.is(result, 42);
  t.deepEqual(resultObj, fbb);
});

test('setOnn knows null/undefined object', function(t) {
  var resultObj = {};

  const result = sg.setOnn(null, ['foo', 'bar', 'baz'], 42);

  t.is(result, 42);
  t.deepEqual(resultObj, {});
});

test('setOnn knows null/undefined index', function(t) {
  var resultObj = {};

  const result = sg.setOnn(resultObj, null, 42);

  t.is(result, 42);
  t.deepEqual(resultObj, {});
});

test('setOnn knows null/undefined index item', function(t) {
  var resultObj = {};

  const result = sg.setOnn(resultObj, ['foo', null, 'baz'], 42);

  t.is(result, 42);
  t.deepEqual(resultObj, {});
});

test('setOnn knows null/undefined index item when splitting index string', function(t) {
  var resultObj = {};

  const result = sg.setOnn(resultObj, 'foo..baz', 42);

  t.is(result, 42);
  t.deepEqual(resultObj, {});
});

test('setOnn knows null/undefined value', function(t) {
  var   resultObj = {};

  const result = sg.setOnn(resultObj, 'foo.bar.baz', null);

  t.is(result, null);
  t.deepEqual(resultObj, {});
});

test('setOnn can index leaf Array', function(t) {
  var resultObj = {foo:{bar:['one']}};

  const result = sg.setOnn(resultObj, ['foo', 'bar', 1], 42);

  t.is(result, 42);
  t.deepEqual(resultObj, {foo:{bar:['one', 42]}});
});

test('setOnn isnt fooled by zero index item', function(t) {
  var resultObj = {foo:{bar:[]}};

  const result = sg.setOnn(resultObj, ['foo', 'bar', 0], 42);

  t.is(result, 42);
  t.deepEqual(resultObj, {foo:{bar:[42]}});
});

//----------------------------------------------------------------------------------------------
// sg.setOnna()

test('setOnna works', function(t) {
  var   resultObj = {};

  const result    = sg.setOnna(resultObj, 'foo.bar.baz', 42);
  const result2   = sg.setOnna(resultObj, 'foo.bar.baz', 43);

  t.is(result,  42);
  t.is(result2, 43);
  t.deepEqual(resultObj, {foo:{bar:{baz:[42,43]}}});
});

test('setOnna knows Array index', function(t) {
  var   resultObj = {};

  const result    = sg.setOnna(resultObj, ['foo', 'bar', 'baz'], 42);
  const result2   = sg.setOnna(resultObj, ['foo', 'bar', 'baz'], 43);

  t.is(result,  42);
  t.is(result2, 43);
  t.deepEqual(resultObj, {foo:{bar:{baz:[42,43]}}});
});

test('setOnna knows null/undefined object', function(t) {
  var   resultObj = {};

  const result  = sg.setOnna(null, 'foo.bar.baz', 42);

  t.is(result, 42);
  t.deepEqual(resultObj, {});
});

test('setOnna knows null/undefined index', function(t) {
  var   resultObj = {};

  const result  = sg.setOnna(resultObj, null, 42);

  t.is(result, 42);
  t.deepEqual(resultObj, {});
});

test('setOnna knows null/undefined index item', function(t) {
  var   resultObj = {};

  const result    = sg.setOnna(resultObj, ['foo', null, 'baz'], 42);
  const result2   = sg.setOnna(resultObj, ['foo', 'bar', 'baz'], 43);

  t.is(result,  42);
  t.is(result2, 43);
  t.deepEqual(resultObj, {foo:{bar:{baz:[43]}}});
});

test('setOnna knows null/undefined value', function(t) {
  var   resultObj = {};

  const result  = sg.setOnna(resultObj, 'foo.bar.baz', null);

  t.is(result, null);
  t.deepEqual(resultObj, {});
});

test('setOnna is not fooled by falsy', function(t) {
  var   resultObj = {};

  const result    = sg.setOnna(resultObj, ['foo', 'bar', 0],  42);
  t.deepEqual(resultObj, {foo:{bar:[[42]]}});

  const result2   = sg.setOnna(resultObj, ['foo', 'bar'],     43);
  t.deepEqual(resultObj, {foo:{bar:[[42],43]}});

  const result3   = sg.setOnna(resultObj, ['foo', 'bar', 0],  44);
  t.deepEqual(resultObj, {foo:{bar:[[42,44],43]}});

  t.is(result,  42);
  t.is(result2, 43);
  t.is(result3, 44);
});

//----------------------------------------------------------------------------------------------
// sg.setOn()

test('setOn works', function(t) {
  var   resultObj = {};

  const result    = sg.setOn(resultObj, 'foo.bar.baz', 42);

  t.is(result,  42);
  t.deepEqual(resultObj, fbb);
});

test('setOn knows Array index', function(t) {
  var   resultObj = {};

  const result    = sg.setOn(resultObj, ['foo', 'bar', 'baz'], 42);

  t.is(result,  42);
  t.deepEqual(resultObj, fbb);
});

test('setOn only returns value if was set', function(t) {
  var   resultObj = {};

  const result    = sg.setOn(resultObj, null, 42);

  t.is(result, undefined);
  t.deepEqual(resultObj, {});
});

test('setOn handles null/undefined object', function(t) {
  var   resultObj = {};

  const result    = sg.setOn(null, 'foo.bar.baz', 42);

  t.is(result, undefined);
  t.deepEqual(resultObj, {});
});

test('setOn knows null/undefined Array index', function(t) {
  var   resultObj = {};

  const result    = sg.setOn(resultObj, ['foo', null, 'baz'], 42);

  t.is(result, undefined);
  t.deepEqual(resultObj, {});
});

test('setOn handles null/undefined value', function(t) {
  var   resultObj = {};

  const result    = sg.setOn(resultObj, 'foo.bar.baz', null);

  t.is(result, undefined);
  t.deepEqual(resultObj, {});
});




