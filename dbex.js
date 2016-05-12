
/**
 *
 */

var _           = require('underscore');
var path        = require('path');
var MongoClient = require('mongodb').MongoClient;

var libDb       = {};
var tests       = [];

var dbs         = {};

libDb.db = function(dbUrlPre, dbName, callback) {
  if (dbs[dbName]) {
    return callback(null, dbs[dbName]);
  }

  var dbUrl = dbUrlPre + '/' + dbName;
  return MongoClient.connect(dbUrl, function(err, db_) {
    if (err) { return callback(err); }

    dbs[dbName] = db_;
    return callback(null, db_);
  });
};

libDb.co = libDb.collection = function(dbUrlPre, dbName, collectionName, callback) {
  return libDb.db(dbUrlPre, dbName, function(err, db) {
    if (err) { return callback(err); }

    return callback(null, db.collection(collectionName));
  });
};

libDb.cursor = function(dbUrlPre, dbName, collectionName, query, projection, callback) {
  return libDb.collection(dbUrlPre, dbName, collectionName, function(err, collection) {
    if (err) { return callback(err); }

    var args = [query];
    if (projection) {
      args.push(projection);
    }

    return callback(null, collection.find.apply(collection, args));
  });
};

libDb.each = function(cursor, callback, finalCb) {
  finalCb = finalCb || function(){};

  var atEnd = false, hasErrors = false, count = 0;

  if (!cursor) { return finalCb(null, {count:count}); }

  /* otherwise */
  var doOne = function() {
    cursor.nextObject(function(err, doc) {
      hasErrors = hasErrors || err;

      if (!err && !doc) { atEnd=true; return finalCb(hasErrors, {count:count}); }

      /* otherwise */
      if (atEnd) { log.error("Cursor iteration beyond end!!"); }

      count += 1;
      return callback(err, doc, function() {
        return setImmediate(function() {
          return doOne();
        });
      });
    });
  };
  doOne();
};

libDb.eachDocInCollection = libDb.eachDocInCo = function(dbUrlPre, dbName, collectionName, query /*, options, callback, finalCb*/) {
  var args      = _.rest(arguments, 4);
  var finalCb   = args.pop();
  var callback  = args.pop();
  var options   = args.pop() || {};

  return libDb.cursor(dbUrlPre, dbName, collectionName, query, options.projection, function(err, cursor_) {
    if (err) { return finalCb(err, {count:0}); }

    var cursor = cursor_;
    if (options.sort)  { cursor = cursor.sort(options.sort); }
    if (options.limit) { cursor = cursor.limit(options.limit); }

    return libDb.eachDoc(cursor, callback, finalCb);
  });
};

libDb.eachDoc = function(cursor, callback, finalCb) {
  if (arguments.length === 3) { return libDb.each(cursor, callback, finalCb); }

  /* otherwise */
  return libDb.eachDocInCollection.apply(libDb, arguments);
};

libDb.toArray = function(dbUrlPre, dbName, collectionName, query /*, options, callback */) {
  var args        = _.toArray(arguments);
  var callback    = args.pop();

  var results = [];
  var myCallback  = function(err, doc, nextDoc) {
    if (!err) {
      results.push(doc);
    }
    return nextDoc();
  };

  return libDb.eachDocInCollection.apply(this, args.concat([myCallback, function(err, counts) {
    return callback(err, results);
  }]));
};

libDb.findOne = function(dbUrlPre, dbName, collectionName, query /*, projection, callback*/) {
  var args        = _.rest(arguments, 4);
  var callback    = args.pop();
  var projection  = args.pop();

  return libDb.cursor(dbUrlPre, dbName, collectionName, query, projection, function(err, cursor) {
    if (err) { return callback(err); }

    return libDb.each(cursor, callback, function() {
      return callback(null, null);
    });
  });
};

libDb.close = function() {
  _.each(dbs, function(db, name) {
    db.close();
  });
};


// Export my stuff
_.each(_.keys(libDb), function(key) {
  exports[key] = libDb[key];
});

