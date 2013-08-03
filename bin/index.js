var fs = require('fs')
  , ElasticSearchClient = require('elasticsearchclient')
  , serverOptions = {
    hosts: [
      {
        host: 'localhost',
        port: 9200
      }
    ]
  }
  , esClient = new ElasticSearchClient(serverOptions)
  , dir;

if (!process.argv[2]) {
  console.log('Usage: node index.js [dir]');
  process.exit();
}

dir = process.argv[2];

lookDir(dir, function (err, results) {
  results.forEach(function (lib) {
    var info = dir + '/' + lib + '/package.json';
    var data = JSON.parse(fs.readFileSync(info, {encoding: "utf-8"}));
    lookDir(dir + '/' + lib, function (err, results) {
      data.versions = results;

      esClient.index('static', 'libs', data, lib)
        .on('data', function (data) {
          console.log('[index] ' + lib + ' indexed.');
        })
        .exec()

    });
  });
});

function lookDir(dir, back) {
  var result = [];
  fs.readdir(dir, function (err, files) {
    if (err) back(err);
    files = files.filter(function (value) {
      return (value[0] != '.');
    });
    var pending = files.length;
    if (!pending) return back(null, result);
    files.forEach(function (file) {
      fs.stat(dir + '/' + file, function (err, stats) {
        if (stats.isDirectory()) {
          result.push(file);
        }

        if (!--pending) back(null, result);
      });
    });
  });
}