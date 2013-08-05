var fs = require('fs')
  , ElasticSearchClient = require('elasticsearchclient')
  , glob = require('glob')
  , natcompare = require('./natcompare')
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

listPackages(dir, function (err, packages) {
  packages.forEach(function (lib) {
    esClient.index('static', 'libs', lib, lib.name)
      .on('data', function (data) {
        console.log('[index] ' + lib.name + ' indexed.');
      })
      .exec()
  });
});


function listPackages(dir, callback) {
  var packages = Array();

  console.log(dir + "/**/package.json");

  glob(dir + "/**/package.json", function (error, matches) {
    matches.forEach(function (element) {
      var package = JSON.parse(fs.readFileSync(element, 'utf8'));
      package.assets = Array();
      var versions = glob.sync(dir + "/" + package.name + "/!(package.json)");
      versions.forEach(function (version) {
        var temp = Object();
        temp.version = version.replace(/^.+\//, "");
        temp.files = glob.sync(version + "/**/*.*");
        for (var i = 0; i < temp.files.length; i++) {
          temp.files[i] = temp.files[i].replace(version + "/", "");
        }
        package.assets.push(temp);
      });
      package.assets.sort(function (a, b) {
        return natcompare.compare(a.version, b.version);
      })
      package.assets.reverse();
      packages.push(package);
    });

    callback(null, packages);
  });
};