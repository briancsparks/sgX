
/**
 *  sgext!
 *
 *  The external libs.
 */

exports.load = function(sg, _) {

  var async           = sg.extlibs.async        = require('async');
  var mkdirp          = sg.extlibs.mkdirp       = require('mkdirp');
  var request         = sg.extlibs.superagent   = require('superagent');
  var moment          = sg.extlibs.moment       = require('moment');
  var shelljs         = sg.extlibs.shelljs      = require('shelljs');
  var split           = sg.extlibs.split        = require('split');
  var chalk           = sg.extlibs.chalk        = require('chalk');

  sg.extlibs.request  = sg.extlibs.superagent;

  var path            = require('path');

  sg.requireShellJsGlobal = function() {
    require('shelljs/global');
  };

  return sg;
};


