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
  this.checkReadAccess = opts.checkReadAccess
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
    let authToken = null;
    let dpopToken = null;
    // Handling messages
    client.on('message', function (message) {
      debug('New message: ' + message)

      if (!message || typeof message !== 'string') {
        return
      }

      var tuple = message.split(' ')
      var command = tuple[0]
      var iri = tuple[1]

      // Only accept:
      // * 'auth w34rffderdrggf...'
      // * 'dpop w4gvsefw4resef4...'
      // * 'sub http://example.tld/hello'
      if (tuple.length < 2) {
        return
      }
      if (command === 'sub') {
        var channel = toChannel ? toChannel(iri) : iri
        self.store.subscribe(channel, iri, client, authToken, dpopToken, function (err, uuid) {
          if (err) {
            // TODO Should return an error
            return
          }

          client.send('ack ' + tuple[1])
        })
      } else if (command === 'auth') {
        authToken = tuple[1]
      } else if (command === 'dpop') {
        dpopToken = tuple[1]
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
          const [ client, channel, authToken, dpopToken ] = subscribers[uuid]
          if (this.checkReadAccess(iri, authToken, dpopToken)) {
            debug('pub ' + channel + ' to ' + client.uuid)
            client.send('pub ' + channel)
          } else {
            debug('not pub ' + channel + ' to ' + client.uuid)
          }
        }
      })

    parallel(tasks, callback)
  })
}
