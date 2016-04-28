
/**
 *  sgaws!
 *
 *  AWS driven sane by SG.
 */

exports.load = function(sg, _) {

  var aws       = sg.extlibs.aws      = require('aws-sdk');

  return sg;
};



