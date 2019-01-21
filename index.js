var debug = require('debug')('ldnode:ws-app')
var SolidWs = require('./lib/server')
var path = require('path')

module.exports = function attachToServer (server, app, opts) {
  var solidWs = new SolidWs(server, opts)
  function publish (req, res, next) {
    req.acl.can(null, 'Read').then(isPublic => {
      if (isPublic) {
        debug('pub ' + req.originalUrl + ' after edit')
        solidWs.publish(req.originalUrl)
        var parent = path.dirname(req.originalUrl) + path.sep
        if (parent !== req.originalUrl) {
          solidWs.publish(parent)
        }
      } else {
        debug('do not pub ' + req.originalUrl + ' after edit')
      }
      next()
    })
  }

  if (app) {
    app.post('/*', publish)
    app.patch('/*', publish)
    app.put('/*', publish)
    app.delete('/*', publish)
  }

  return solidWs
}
