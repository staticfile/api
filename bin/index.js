const fetch = require('node-fetch')
const util = require('util')
const knex = require('knex')({
  client: 'mysql',
  connection: require('../dbconfig')
})

const cdnjsAPIRoot = 'https://api.cdnjs.com/libraries/'

function fetchAllLibraiesNames() {
  return fetch(cdnjsAPIRoot)
    .then(res => res.json())
    .then(data => data.results.map(n => n.name))
}

const excludes = [ 'mathjax', 'material-design-icons', 'browser-logos', 'twemoji' ]

function fetchLib(libName, trx) {
  if (excludes.includes(libName)) return Promise.resolve(libName)

  return fetch(`${cdnjsAPIRoot}${libName}`)
    .then(res => res.json())
    .then(lib => {
      const index = {
        name: lib.name,
        filename: lib.filename,
        homepage: lib.homepage,
        version: lib.version,
        keywords: lib.keywords,
        description: lib.description,
        assets: lib.assets,
        repositories: lib.repositories || (lib.repository && [lib.repository]) || []
      }

      return updateIndex(index, lib.name, trx)
    })
    .then(libName => {
      console.log('[index] ' + libName + ' indexed.')
      return libName
    })
    .catch(err => {
      console.error(err.message)
      return Promise.resolve(libName)
    })
}

knex.transaction(trx => {
  fetchAllLibraiesNames()
    .then(libNames => {
      console.log(libNames.length)
      return libNames.map(name => fetchLib(name, trx))
    })
    .then(promises => Promise.all(promises))
    .then(() => trx.commit())
    .catch(err => {
      console.error(err)
      trx.commit()
    })
})
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch(err => {
    console.error(err)
  })

function updateIndex(index, name, trx) {
  return new Promise((resolve, reject) => {
    const library = {
      name: index.name,
      version: index.version,
      description: index.description,
      homepage: index.homepage || '',
      keywords: (index.keywords || []).join(','),
      repositories: index.repositories.map(n => `${n.type}@${n.url}`)
    }

    const assets = index.assets.map(asset => {
      return {
        library: index.name,
        files: asset.files.join('||'),
        version: asset.version
      }
    })

    const insertLib = knex('libraries').insert(library)
    delete library.id
    const updateLib = knex('libraries').update(library)
    const queryLib = util.format('%s on duplicate key update %s',
      insertLib.toString(), updateLib.toString().replace(/^update ([`"])[^\1]+\1 set/i, ''))

    knex.raw(queryLib).transacting(trx)
      .then(() => {
        return Promise.all(
          assets.map(asset => knex('assets').insert(asset).transacting(trx))
        )
      })
      .then(() => resolve(name))
      .catch(() => resolve(name))
  })
}