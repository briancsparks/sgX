
var sg            = require('sgsg');
var _             = sg._;
var verbose       = sg.mkVerbose('sg-mongo-cli');
var dbex          = require('./dbex');

var dieTrying     = sg.mkDieTrying([
  "Usage:",
  "   sg [--vverbose] mongo --db=<db-name> --co=<collection-name> <operation> [--params]",
  "",
  "     operation:",
  "       findOne (or find or query)",
  ""
]);

var die           = sg.mkDie(dieTrying);

exports.run = function(ARGV_) {
  var ARGV = ARGV_ || sg.ARGV();
  verbose(2, 'ARGV', ARGV);

  var query = {}, projection, limit, params, callArgs = [];

  // Find the operation that the caller wants
  var op            = ARGV.args.shift();
  if (!op) { return die(); }

  op = op.toLowerCase();

  // Determine the URL to the DB
  var dbHost        = ARGV.dbhost || ARGV.db_host || process.env.SG_MONGO_HOSTDB || process.env.SG_MONGO_HOST || process.env.SG_MONGO_DB;
  var dbPort        = ARGV.dbport || ARGV.db_port || process.env.SG_MONGO_DBPORT || process.env.SG_MONGO_PORT || 27017;
  var dbName        = ARGV.db     || ARGV.db_name || process.env.SG_MONGO_DBNAME || process.env.SG_MONGO_DB   || process.env.SG_MONGO_NAME;
  var dbCollection  = ARGV.co     || ARGV.co_name || ARGV.collection             || process.env.SG_MONGO_CO   || process.env.SG_MONGO_COLLECTION;

  if (!dbHost || !dbPort || !dbName || !dbCollection) { return die(); }

  var dbUrlPre      = "mongodb://" + dbHost + ":" + dbPort;

  params = ARGV.getParams({skipArgs:true});
  sg.extracts(params, 'dbhost', 'db_host', 'dbport', 'db_port', 'db', 'db_name', 'co', 'co_name', 'verbose', 'vverbose', 'vvverbose');

  verbose(2, 'using', params, dbUrlPre, dbHost, dbPort, dbName, dbCollection);

  callArgs = [dbUrlPre, dbName, dbCollection];

  if (op === 'findone') {
    params      = analyzeQueryParams(params);
    callArgs    = _.compact(callArgs.concat([params.query || query, params.projection || projection, params.limit || limit]));

    callArgs.push(dieTrying(function(err, result) {
      process.stdout.write(JSON.stringify(result) + '\n');
      dbex.close();
    }));

    verbose(2, 'using2', params, dbUrlPre, dbHost, dbPort, dbName, dbCollection);
    return dbex.findOne.apply(dbex, callArgs);
  }

  if (op === 'query' || op === 'find') {
    params      = analyzeQueryParams(params);
//    callArgs    = _.compact(callArgs.concat([params.query || query, params.projection || projection, params.limit || limit]));

    verbose(2, 'using2', params, dbUrlPre, dbHost, dbPort, dbName, dbCollection);
    return dbexop('toArray', callArgs, [params.query || query, params.projection || projection, params.limit || limit], function(err, result) {
      process.stdout.write(JSON.stringify(result) + '\n');
      dbex.close();
    });

//    callArgs.push(dieTrying(function(err, result) {
//      process.stdout.write(JSON.stringify(result) + '\n');
//      dbex.close();
//    }));
//
//    return dbex.findOne.apply(dbex, callArgs);
  }

  if (op === 'insert') {

    if (!('query' in (params = analyzeQueryParams(params)))) { return die(); }

    return dbop('insert', dbUrlPre, dbName, dbCollection, [params.query], function(err, result) {
      process.stdout.write(JSON.stringify(result) + '\n');
      dbex.close();
    });
  }
};

function dbop(op, dbUrlPre, dbName, dbCollection, params_, callback) {
  var params = params_.concat([callback]);
  return dbex.collection(dbUrlPre, dbName, dbCollection, dieTrying(function(err, collection) {
    return collection[op].apply(collection, params);
  }));
}

function dbexop(op, callArgs_, params, callback) {
  var callArgs    = _.compact(callArgs_.concat(params));

  callArgs.push(dieTrying(function(err, result) {
    process.stdout.write(JSON.stringify(result) + '\n');
    dbex.close();
  }));

  return dbex[op].apply(dbex, callArgs);
}

function analyzeQueryParams(params_) {
  var params = sg.deepCopy(params_);
  var result = {};

  result.limit = sg.extract(params, 'limit');

  var isIncludingProjection = false, isIdHandled = false, numProjections = 0;

  _.each(params, function(value_, key) {
    var value = value_;

    // Extract projection params
    var m = /^prj_(.*)$/i.exec(key);
    if (m) {
      value                   = sg.trueOrFalse(value);
      result.projection       = result.projection || {};
      result.projection[m[1]] = value;

      numProjections        += 1;
      isIncludingProjection  = isIncludingProjection || value;

      delete params[key];
    }
  });

  if (isIncludingProjection && numProjections === 1 && !('_id' in result.projection)) {
    result.projection._id = false;
  }

  result.query = {};
  _.each(params, function(value, key) {
    if (value[0] === '^')               { result.query[key] = new RegExp(value); }
    else if (value === 'exists:true')   { result.query[key] = {$exists:true}; }
    else if (value === 'exists:false')  { result.query[key] = {$exists:false}; }
    else                                { result.query[key] = value; }
  });

  return result;
}


