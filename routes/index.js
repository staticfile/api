exports.index = function (req, res) {

  if (req.headers.host === 'staticfile.org') {
    return res.redirect('https://www.staticfile.org')
  }

  res.end('staticfile.org api service!');
};

exports.api = require('./api');