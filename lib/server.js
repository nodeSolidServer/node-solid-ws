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
  this.authorize = opts.authorize // Authorization callback
  var toChannel = opts.toChannel || defaultToChannel

  // Starting WSS server
  var wss = new WebSocketServer({
    server: server,
    clientTracking: false,
    path: opts.path
  })

  // Handling a single connection
  wss.on('connection', function (client, req) {
    debug('New connection')
    // Store the request for authorization checks
    client.upgradeReq = req

    // Handling messages
    client.on('message', function (message) {
      debug('New message: ' + message)

      // ws@8 may send Buffer, convert to string
      if (Buffer.isBuffer(message)) {
        message = message.toString()
      }

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

      // Check authorization if callback is provided
      if (self.authorize) {
        self.authorize(iri, req, function (err, allowed) {
          if (err || !allowed) {
            debug('Subscription denied for ' + iri)
            client.send('err ' + iri + ' forbidden')
            return
          }

          // Authorization passed, proceed with subscription
          var channel = toChannel ? toChannel(iri) : iri
          self.store.subscribe(channel, iri, client, function (err, uuid) {
            if (err) {
              client.send('err ' + iri + ' error')
              return
            }

            client.send('ack ' + tuple[1])
          })
        })
      } else {
        // No authorization, proceed directly
        var channel = toChannel ? toChannel(iri) : iri
        self.store.subscribe(channel, iri, client, function (err, uuid) {
          if (err) {
            // TODO Should return an error
            return
          }

          client.send('ack ' + tuple[1])
        })
      }
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
