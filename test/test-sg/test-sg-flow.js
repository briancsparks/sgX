
/**
 *
 */
var test              = require('ava');

var sg    = require('../../sg');

test.cb('__run3 does enext right', function(t) {
  t.plan(1);
  var i = 0;

  return sg.__run3([function(next, enext, enag, ewarn) {
    i += 1;
    return next();
  }, function(next, enext, enag, ewarn) {
    return fail(enext(function(err) {
      i += 1;
      return next();
    }));
  }], function() {
    t.is(i, 1);
    t.end();
  });
});

test.cb('__run3 does ewarn right', function(t) {
  t.plan(1);
  var i = 0;

  console.log('Should display a WARNING');
  return sg.__run3([function(next, enext, enag, ewarn) {
    i += 1;
    return next();
  }, function(next, enext, enag, ewarn) {
    return fail(ewarn(function(err) {
      i += 1;
      return next();
    }, 'calling-fail'));
  }], function() {
    t.is(i, 1);
    t.end();
  });
});

test.cb('__run3 does enag right', function(t) {
  t.plan(1);
  var i = 0;

  console.log('Should display a NAG');
  return sg.__run3([function(next, enext, enag, ewarn) {
    i += 1;
    return next();
  }, function(next, enext, enag, ewarn) {
    return fail(enag(function(err) {
      i += 1;
      return next();
    }, 'calling-fail'));
  }], function() {
    t.is(i, 2);
    t.end();
  });
});

test.cb('__run3 can run properly', function(t) {
  t.plan(1);
  var i = 0;

  return sg.__run3([function(next, enext, enag, ewarn) {
    i += 1;
    return next();
  }, function(next, enext, enag, ewarn) {
    return success(enext(function(err) {
      i += 1;
      return next();
    }, 'calling-success'));
  }], function() {
    t.is(i, 2);
    t.end();
  });
});

test.cb('iwrap handles aborts', function(t) {
  t.plan(1);

  var visited = {};

  console.log('Should display a total fail message with stack trace');
  const asyncFn = function(callback) {
    return sg.iwrap('asyncFn', callback, function(eabort) {

      return sg.__run3([function(next, enext, enag, ewarn) {
        visited.one = true;
        return next();

      }, function(next, enext, enag, ewarn) {
        return fail(eabort(function(err) {
          visited.two = true;
          return next();
        }, 'calling-fail'));

      }], function() {
        visited.three = true;
      });
    });
  };

  return asyncFn(function(err) {
    t.deepEqual(visited, {one:true});
    t.end();
  });


});

test.cb('iwrap handles success', function(t) {
  t.plan(1);

  var visited = {};

  console.log('Should display a total fail message with stack trace');
  const asyncFn = function(callback) {
    return sg.iwrap('asyncFn', callback, function(eabort) {

      return sg.__run3([function(next, enext, enag, ewarn) {
        visited.one = true;
        return next();

      }, function(next, enext, enag, ewarn) {
        return success(eabort(function(err) {
          visited.two = true;
          return next();
        }, 'calling-success'));

      }], function() {
        visited.three = true;
      });
    });
  };

  return asyncFn(function(err) {
    t.deepEqual(visited, {one:true, two:true, three:true});
    t.end();
  });


});

function fail(callback) {
  return callback('fail');
}

function success(callback) {
  return callback();
}

