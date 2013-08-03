exports.index = function (req, res) {
  res.end('staticfile.org api service!');
};

exports.api = require('./api');