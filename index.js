var SolidWs = require('./lib/server')

module.exports = function attachToServer (server, app, opts) {
  var solidWs = new SolidWs(server, opts)
  return solidWs
}
