const fs = require('fs')
const path = require('path')
const knex = require('knex')({
  client: 'mysql',
  connection: require('../db.json')
})
const { compare:versionCompare } = require('../bin/natcompare')

const populars = []
const popularsCache = []
fs.readFile(path.resolve(__dirname, '../popular.json'), (err, body) => {
  if (err) return

  body = body || '[]'

  populars.push(...JSON.parse(body.toString()))
})

exports.popular = function(req, res) {
  Promise.all([
    // Popular Libraries
    knex.select().from('libraries').whereIn('name', populars).orderByRaw(`FIELD(name, ${populars.map(n => `"${n}"`).join(',')})`),
    // Assets
    knex.select().from('assets').whereIn('library', populars).groupBy('library', 'id')
  ])
    .then(([ libraries, assets ]) => {
      for (const library of libraries) {
        library.keywords = library.keywords.split(',')
        const repository = (library.repositories || '').split('@').filter(Boolean)
        library.repositories = [ !!repository.length ? {
          type: repository[0],
          url: repository[1]
        } : null ].filter(Boolean)

        library.assets = assets
          .filter(asset => asset.library === library.name)
          .sort((a, b) => versionCompare(a.version, b.version))
          .reverse()
          .map(asset => {
            asset.files = asset.files.split('||')
            delete asset.library
            delete asset.id

            return asset
          })
        delete library.id
      }

      if (!!popularsCache.length) popularsCache.push(...libraries)

      res.api({ libs: libraries })
    })
    .catch(err => {
      res.api({success: false, error: err})
    })
}

exports.search = function(req, res) {
  const q = req.query.q.toLowerCase()

  knex.select().from('libraries')
    .where('name', 'like', `%${q}%`)
    .orderBy('weight', 'desc')
    .limit(req.query.count || 30)
    .then(rows => {
      const total = rows.length

      const libraries = rows.map(library => {
        library.keywords = library.keywords.split(',')
        const repository = (library.repositories || '').split('@').filter(Boolean)
        library.repositories = [ !!repository.length ? {
          type: repository[0],
          url: repository[1]
        } : null ].filter(Boolean)
        delete library.id

        return library
      })

      res.api({
        total,
        libs: libraries
      })
    })
    .catch(err => {
      console.error(err)
      res.api({ success: false, error: err })
    })
}

exports.show = function(req, res) {
  const name = req.params.package

  Promise.all([
    knex.select().from('libraries').where('name', name),
    knex.select().from('assets').where('library', name).orderBy('version', 'desc')
  ])
    .then(([ [ library ], assets ]) => {
      if (!library) {
        return res.api({ success: false, error: new Error('Library not found') })
      }

      library.keywords = library.keywords.split(',')
      const repository = (library.repositories || '').split('@').filter(Boolean)
      library.repositories = [ !!repository.length ? {
        type: repository[0],
        url: repository[1]
      } : null ].filter(Boolean)

      library.assets = assets
        .filter(asset => asset.library === library.name)
        .sort((a, b) => versionCompare(a.version, b.version))
        .reverse()
        .map(asset => {
          asset.files = asset.files.split('||')
          delete asset.library
          delete asset.id

          return asset
        })
      delete library.id

      res.api(library)
    })
    .catch(err => {
      console.error(err)
      res.api({ success: false, error: err })
    })
}