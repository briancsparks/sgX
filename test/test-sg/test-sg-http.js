
import test       from 'ava';
var    sg         = require('../../sg');

var part1 = '/api/';
var part2 = '/foo';

test('Normalizes easy URL', function(t) {
  var url = part1+'/'+part2;                // `${part1}/${part2}`

  url = sg.normlz(url);

  t.is(url, '/api/foo');
});

test('Normalizes easy URL with protocol', function(t) {
  var url = 'http://example.com/'+part1+'/'+part2;                // `http://example.com/${part1}/${part2}`

  url = sg.normlz(url);

  t.is(url, 'http://example.com/api/foo');
});

test('Normalizes easy URL with https protocol', function(t) {
  var url = 'https://example.com/'+part1+'/'+part2;                // `https://example.com/${part1}/${part2}`

  url = sg.normlz(url);

  t.is(url, 'https://example.com/api/foo');
});

test('Normalizes leaves trailing slash', function(t) {
  var url = part1+'/'+part2+'/';                // `${part1}/${part2}/`

  url = sg.normlz(url);

  t.is(url, '/api/foo/');
});

