var ElasticSearchClient = require('elasticsearchclient')
  , serverOptions = {
    hosts: [
      {
        host: 'localhost',
        port: 9200
      }
    ]
  }
  , _ = require('underscore')

var elasticSearchClient = new ElasticSearchClient(serverOptions);

exports.search = function (req, res) {
  var qryObj = {
    "query": {
      "term": {
        "name": req.query.q
      }
    },
    "size": req.query.count || 10
  };

  res.header({
    "Access-Control-Allow-Origin": 'http://www.staticfile.org',
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "X-PINGOTHER"
  });

  var render = function (data) {
    if (req.query[req.app.get('jsonp callback name')]) {
      res.jsonp(data);
    } else {
      res.json(data);
    }
  };

  elasticSearchClient.search('static', 'libs', qryObj)
    .on('data', function (data) {
      data = JSON.parse(data);

      if (data.hits) {
        data.hits.libs = _.map(data.hits.hits, function (lib) {
          return lib._source;
        });

        delete data.hits.hits;

        render(data.hits);
      } else {
        render({total: 0, max_score: 0, libs: []});
      }
    })
    .on('done', function () {
      //always returns 0 right now
    })
    .on('error', function (error) {
      render({success: false, error: error});
    })
    .exec()
};