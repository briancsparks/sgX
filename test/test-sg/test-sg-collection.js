
import test       from 'ava';
var    sg         = require('../../sg');

test('pad pads zeros', function(t) {
  var s = "1";

  s = sg.pad(s, 3, '0');

  t.is(s, '001');
});
