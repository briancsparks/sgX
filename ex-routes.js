
/**
 *
 */

var sg              = require('./sg');
var _               = sg._;

var verbose         = sg.mkVerbose('sgExRoutes');

var routes = {};

var send = function(res, code, json_) {
  var json = json_ || {};
  var body = JSON.stringify(json);

  res.writeHead(code, {
    'Content-Length': body.length,
    'Content-Type': 'application/json'
  });

  res.end(body);
};

routes.nextMatch = function(req, res, match, err) {
  if (err) {
    verbose(0, '---------------------------------------------------------------------------------------------------');
    verbose(0, '---------------------------------------------------------------------------------------------------');
    verbose(0, '---------------------------------------------------------------------------------------------------');
    verbose(0, '---------------------------------------------------------------------------------------------------');

    verbose(0, err);

    verbose(0, '---------------------------------------------------------------------------------------------------');
    verbose(0, '---------------------------------------------------------------------------------------------------');
  }

  if ((match = match.next())) {
    return match.fn(req, res, match);
  }

  /* otherwise -- no other match; must send error response */
  return send(res, 404);
}


_.each(routes, function(value, name) {
  exports[name] = value;
});

