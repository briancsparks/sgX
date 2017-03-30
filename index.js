#!/usr/bin/env node

var sg              = require('sgsg');
var _               = sg._;
var ARGV            = sg.ARGV();
var path            = require('path');

var main = function() {
  var cmd, mod, script, modName;

  if ((cmd = ARGV.args.shift()) === 'run') {

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

main();

