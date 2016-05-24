#!/usr/bin/env node

var sg              = require('sgsg');
var _               = sg._;
var ARGV            = sg.ARGV();
var path            = require('path');
var aws             = require('aws-sdk');
var sgLambda        = new sg.SgLambda();
var lambda          = new aws.Lambda({region: 'us-east-1'});

var cmd             = ARGV.args.shift();

var mod, script, modName;

if (cmd === 'run' || cmd === 'sls') {

  modName = ARGV.args.shift();
  mod     = require(path.join(process.cwd(), modName));
  script  = ARGV.args.shift();

  if (!mod[script]) {
    console.error('No such script ' + script + ' in ' + modName);
    process.exit(1);
  }

  /* otherwise */
  return sg.lambdaLocal(mod, script, ARGV, {}, function(err, result) {
    if (err) { console.error(err); }
    console.log(result);
  });

} else if (cmd === 'mongo') {
  return require('./mongo-cli').run(ARGV);

// Invoke a "real" Lambda function
} else if (cmd === 'lambda') {

  var params = ARGV.getParams({skipArgs:true});
  var fName  = sg.extract(params, 'name');

  return sgLambda.invoke(fName, params, {}, function(err, lambdaResponse) {
    if (err) { console.error(err); process.exit(1); }

    verbose(2, 'lambdaResponse: ', lambdaResponse);
    return sgLambda.getPayload(err, lambdaResponse, function(err, payload) {
      if (err) { console.error(err); process.exit(1); }

      verbose(2, 'lambdaPayload: ', payload);
    });
  });
}

console.error('Error: unknown');
process.exit(1);

