
exports.load = function(sg, _) {

  var setFlag = function(self, name, value) {
    if (arguments.length < 3) { value = true; }

    self[name] = value;
    self['_'+name] = function() { return value; }
  };

  var deleteFlag = function(self, name) {

    delete self[name];
    self['_'+name] = function() { return /*undefined*/; }
  };

  var parseCmdArgs = sg._parseCmdArgs = function(self, argv) {

    self.executable = argv[0];
    self.script     = argv[1];

    var curr, next;
    for (var i = 2; i < argv.length; i++) {
      next = i+1 < argv.length ? argv[i+1] : null;
      curr = argv[i];

      // --foo=bar
      if ((m = /^--([a-zA-Z_0-9\-]+)=([^ ]+)$/.exec(curr)) && m.length === 3) {
        setFlag(self, m[1], m[2]);
      }

      // --foo=
      else if ((m = /^--([a-zA-Z_0-9\-]+)=$/.exec(curr))) {
        deleteFlag(self, m[1]);
      }

      // --foo-
      else if ((m = /^--([^ ]+)-$/.exec(curr))) {
        setFlag(self, m[1], false);
      }

      // --foo
      else if ((m = /^--([^ ]+)$/.exec(curr))) {
        setFlag(self, m[1]);
      }

    }

  };

  return sg;
};

