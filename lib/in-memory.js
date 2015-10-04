module.exports = InMemory

var uuid = require('node-uuid')

function InMemory (opts) {
  opts = opts || {}
  this.uris = opts.uris || {}
  this.subscribers = opts.subscribers || {}
}

InMemory.prototype.subscribe = function (uri, client, callback) {
  var self = this
  this.uris[uri] = true

  if (!this.subscribers[uri]) {
    this.subscribers[uri] = {}
  }

  client.uuid = uuid.v1()
  this.subscribers[uri][client.uuid] = client

  client.on('close', function () {
    delete self.subscribers[uri][client.uuid]
  })

  return callback(null, client.uuid)
}

InMemory.prototype.get = function (uri, callback) {
  return callback(null, this.subscribers[uri] || {})
}
