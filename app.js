/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set('jsonp callback name', 'callback');
app.set('json spaces', '');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.compress());
app.use('/v1', function (req, res, next) {
  res.header({
    "Access-Control-Allow-Origin": 'http://staticfile.org',
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "X-PINGOTHER"
  });

  res.api = function (data) {
    if (req.query[req.app.get('jsonp callback name')]) {
      res.jsonp(data);
    } else {
      res.json(data);
    }
  };
  next();
});
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/v1/search', routes.api.search);
app.get('/v1/popular', routes.api.popular);

http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});
