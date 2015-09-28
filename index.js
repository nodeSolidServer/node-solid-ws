var SolidWs = require('./server')

module.exports = function attachToServer (server, app, opts) {
  var solidWs = new SolidWs(server, opts)
  if (app) server.on('request', app)
  return solidWs
}
