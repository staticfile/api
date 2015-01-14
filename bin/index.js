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
  , exec = require('child_process').exec
  , path = require('path')
  , dir;

if (!process.argv[2]) {
  console.log('Usage: node index.js <dir>');
  process.exit();
}

dir = process.argv[2];

listPackages(dir, function (lib) {
    var index = {
      name: lib.name,
      filename: lib.filename,
      homepage: lib.homepage,
      version: lib.version,
      keywords: lib.keywords,
      description: lib.description,
      assets: lib.assets,
      repositories: lib.repositories || (lib.repository && [lib.repository]) || []
    };

    esClient.index('static', 'libs', index, lib.name)
      .on('data', function (data) {
        console.log('[index] ' + lib.name + ' indexed.');
      })
      .exec()
});


function listPackages(dir, callback) {
  console.log(dir + "/**/package.json");

  exec("ls " + dir + "/**/package.json", function (error, stdout) {
    if (error) {
      console.log("lookup packages failed: " + error)
      return;
    }
    var matches = stdout.trim().split("\n");
    matches.forEach(function (file) {
      var package = require(fs.realpathSync(file));
      package.assets = Array();

      console.log(package.name, 'is found.');

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

      if (!package.assets[0]) return;

      package.assets.sort(function (a, b) {
        return natcompare.compare(a.version, b.version);
      })
      package.assets.reverse();
      callback(package);
    });

  });
};
