var debug = require('debug')('ldnode:ws-app')
var SolidWs = require('./lib/server')
var path = require('path')

module.exports = function attachToServer (server, app, opts) {
  var solidWs = new SolidWs(server, opts)

  if (app) {

    app.post('/*', function (req, res, next) {
      debug('pub ' + req.originalUrl + ' after post')
      solidWs.publish(req.originalUrl)
      solidWs.publish(path.basename(req.originalUrl))
      next()
    })
    app.patch('/*', function (req, res, next) {
      debug('pub ' + req.originalUrl + ' after patch')
      solidWs.publish(req.originalUrl)
      console.log(solidWs.store)
      next()
    })
    app.put('/*', function (req, res, next) {
      debug('pub ' + req.originalUrl + ' after put')
      solidWs.publish(req.originalUrl)
      next()
    })
    app.delete('/*', function (req, res, next) {
      debug('pub ' + req.originalUrl + ' after delete')
      solidWs.publish(req.originalUrl)
      solidWs.publish(path.basename(req.originalUrl))
      next()
    })
  }

  return solidWs
}
