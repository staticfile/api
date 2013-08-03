exports.index = function (req, res) {
  res.end('staticfile.org backend!');
};

exports.api = require('./api');