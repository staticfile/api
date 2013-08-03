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

  elasticSearchClient.search('static', 'libs', qryObj)
    .on('data', function (data) {
      var data = JSON.parse(data);

      data.hits.hits = _.map(data.hits.hits, function (lib) {
        return lib._source;
      });

      res.json(data.hits);
    })
    .on('done', function () {
      //always returns 0 right now
    })
    .on('error', function (error) {
      res.json({success: false, error: error});
    })
    .exec()
};