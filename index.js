#!/usr/bin/env node

var sg                        = require('sgsg');
var _                         = sg._;
var getStdin                  = require('get-stdin');
var parseString               = require('xml2js').parseString;
var path                      = require('path');

var ARGV                      = sg.ARGV();

var main = function() {
  var cmd, mod, script, modName;

  var cmd = ARGV.args.shift();
  if (lib[cmd]) {
    return lib[cmd](ARGV);
  } else if (cmd === 'run') {

    modName = ARGV.args.shift();
    mod     = require(path.join(process.cwd(), modName));
    script  = ARGV.args.shift();

    if (!mod[script]) {
      console.error('No such script ' + script + ' in ' + modName);
      process.exit(1);
      return;
    }

    /* otherwise */
    return mod[script](ARGV, {}, function(err) {
      if (err) {
        console.error(err);
        process.exit(1);
        return;
      }

      /* otherwise -- success */
      console.log(sg.inspect(_.rest(arguments)));
      process.exit(0);
    });
  }

  console.error('Error: unknown');
  process.exit(1);
};

var lib = {};

lib.xml2json = lib.xj = function(argv) {
  return getStdin().then(function(xml) {
    return parseString(xml, function (err, result) {
      process.stdout.write(JSON.stringify(result)+'\n');
    });
  });
};

main();

