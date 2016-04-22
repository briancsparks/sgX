
/**
 *  sgext!
 *
 *  The external libs.
 */

var sg            = require('./sgmore');
//var sg = {extlibs:{}};

//var _             = sg.extlibs._            = require('underscore');
var async         = sg.extlibs.async        = require('async');
var mkdirp        = sg.extlibs.mkdirp       = require('mkdirp');
var request       = sg.extlibs.superagent   = require('superagent');
var moment        = sg.extlibs.moment       = require('moment');
var shelljs       = sg.extlibs.shelljs      = require('shelljs');

sg.extlibs.request = sg.extlibs.superagent;

var path          = require('path');

sg.requireShellJsGlobal = function() {
  require('shelljs/global');
};

_.each(sg, function(fn, name) {
  exports[name] = sg[name];
});


