var WebSocketServer = require('ws').Server
var debug = require('debug')('solid:subscription')
var InMemory = require('./in-memory')
var parallel = require('run-parallel')

module.exports = WsServer

function WsServer (server, opts) {
  var self = this

  opts = opts || {}
  this.suffix = opts.suffix || '.changes'
  this.store = opts.store || new InMemory(opts)

  // Starting WSS server
  var wss = new WebSocketServer({
    server: server,
    clientTracking: false,
    path: opts.path
  })

  // Handling a single connection
  wss.on('connection', function (client) {
    debug('New connection')
    // var location = url.parse(client.upgradeReq.url, true)

    // Handling messages
    client.on('message', function (message) {
      debug('New message: ' + message)

      if (!message || typeof message !== 'string') {
        return
      }

      var tuple = message.split(' ')

      // Only accept 'sub http://example.tld/hello'
      if (tuple.length < 2 || tuple[0] !== 'sub') {
        return
      }

      self.store.subscribe(tuple[1], client, function (err, uuid) {
        if (err) {
          // TODO Should return an error
          return
        }

        client.send('ack ' + tuple[1])
      })
    })

    // Respond to ping
    client.on('ping', function () {
      client.pong()
    })
  })
}

WsServer.prototype.publish = function (uri, callback) {
  this.store.get(uri, function (err, subscribers) {
    
    if (err) {
      if (callback) return callback(err)
      else return
    }

    if (!subscribers) {
      subscribers = {}
    }

    var tasks = Object.keys(subscribers)
      .map(function (uuid) {
        return function (cb) {
          var client = subscribers[uuid]
          client.send('pub ' + uri)
        }
      })

    parallel(tasks, callback)
  })
}
