
/**
 *  sgext!
 *
 *  The external libs.
 */

exports.load = function(sg, _) {

  var mkdirp          = sg.extlibs.mkdirp       = require('mkdirp');
  var request         = sg.extlibs.superagent   = require('superagent');
  var moment          = sg.extlibs.moment       = require('moment');
  var shelljs         = sg.extlibs.shelljs      = require('shelljs');
  var fsExtra         = sg.extlibs.fsExtra      = require('fs-extra');
  var split           = sg.extlibs.split        = require('split');
  var chalk           = sg.extlibs.chalk        = require('chalk');
  var mime            = sg.extlibs.mime         = require('mime-types');

  sg.extlibs.request  = sg.extlibs.superagent;
  sg.extlibs.fs       = sg.extlibs.fsExtra;

  sg.fs = sg.extend(sg.extlibs.fs, sg.extlibs.shelljs);

  var path            = require('path');

  sg.requireShellJsGlobal = function() {
    require('shelljs/global');
  };

  return sg;
};


