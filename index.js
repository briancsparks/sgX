#!/usr/bin/env node

var sg      = require('sgsg');
var _       = sg._;
var ARGV    = sg.ARGV();
var path    = require('path');

var cmd     = ARGV.args.shift();

var mod, script, modName;

if (cmd === 'run' || cmd === 'sls') {

  modName = ARGV.args.shift();
  mod     = require(path.join(process.cwd(), modName));
  script  = ARGV.args.shift();

  if (!mod[script]) {
    console.error('No such script ' + script + ' in ' + modName);
    process.exit(1);
  }

  if (mod[script]) {
    return mod[script](ARGV, {}, function(err, result) {
      if (err) { console.error(err); }
      console.log(result);
    });
  }
} else if (cmd === 'mongo') {
  return require('./mongo-cli').run(ARGV);
}

console.error('Error: unknown');
process.exit(1);

