
import test       from 'ava';
var    sg         = require('../../sg');
var    _          = sg._;

test('ARGV knows long flag', function(t) {
  var argv = {};
  sg._parseCmdArgs(argv, args('--long'));

  t.is(argv.executable, 'node');
  t.is(argv.script, 'script.js');
  t.true(argv.long);
});

test('ARGV knows long flag negation', function(t) {
  var argv = {};
  sg._parseCmdArgs(argv, args('--long-'));

  t.false(argv.long);
});

test('ARGV knows --foo=bar', function(t) {
  var argv = {};
  sg._parseCmdArgs(argv, args('--foo=bar'));

  t.is(argv.foo, 'bar');
});

test('ARGV knows --foo=', function(t) {
  var argv = {};
  sg._parseCmdArgs(argv, args('--foo', '--foo='));

  t.falsy(argv.foo);
});

test('ARGV knows functions', function(t) {
  var argv = {};
  sg._parseCmdArgs(argv, args('--foo', '--bar', '--bar=', '--baz-', '--quxx=pi'));

  t.true(argv._foo());
  t.false(argv._baz());
  t.is(argv._quxx(), 'pi');
  t.falsy(argv._bar());
});

function args() {
  return ['node', 'script.js'].concat(_.toArray(arguments));
}

