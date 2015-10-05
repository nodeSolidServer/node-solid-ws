var WebSocketServer = require('ws').Server
var debug = require('debug')('ldnode:ws')
var InMemory = require('./in-memory')
var parallel = require('run-parallel')
var url = require('url')

module.exports = WsServer

function defaultToChannel(iri) {
  return url.parse(iri).path
}

function WsServer (server, opts) {
  var self = this

  opts = opts || {}
  this.suffix = opts.suffix || '.changes'
  this.store = opts.store || new InMemory(opts)
  var toChannel = opts.toChannel || defaultToChannel

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
      var command = tuple[0]
      var iri = tuple[1]

      // Only accept 'sub http://example.tld/hello'
      if (tuple.length < 2 || command !== 'sub') {
        return
      }

      var channel = toChannel ? toChannel(iri) : iri
      self.store.subscribe(channel, iri, client, function (err, uuid) {
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

WsServer.prototype.publish = function (iri, callback) {
  this.store.get(iri, function (err, subscribers) {
    
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
          var client = subscribers[uuid][0]
          var channel = subscribers[uuid][1]
          debug('pub ' + channel + ' to ' + client.uuid)
          client.send('pub ' + channel)
        }
      })

    parallel(tasks, callback)
  })
}
