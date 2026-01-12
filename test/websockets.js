var WebSocket = require('ws')
var assert = require('chai').assert
var http = require('http')
var parallel = require('run-parallel')
var SolidWs = require('../')
var WsServer = require('../lib/server')
var EventEmitter = require('events').EventEmitter
var utils = require('./utils')

describe('Solid-ws', function() {
  var server = http.createServer()
  var port = 8000
  var pubsub = SolidWs(server)
  
  var serverWithAuth = http.createServer()
  var portWithAuth = 8001
  var allowedUri = 'http://example.com/allowed'
  var deniedUri = 'http://example.com/denied'
  var pubsubWithAuth = new WsServer(serverWithAuth, {
    authorize: function(iri, req, callback) {
      // Allow subscription to allowedUri, deny deniedUri
      if (iri === allowedUri) {
        callback(null, true)
      } else if (iri === deniedUri) {
        callback(null, false)
      } else {
        callback(null, true) // Allow others by default
      }
    }
  })

  function check(msgs, uris, done) {
    parallel(msgs.map(function (msg, i) {
      return function(cb) {
        assert.equal(msg.split(' ')[0], 'ack')
        var index = uris.indexOf(msg.split(' ')[1])
        assert.notEqual(index, -1, "URL not found")
        uris.splice(index, 1)
        cb()
      }
    }),
    function() {
      assert.equal(uris.length, 0)
      done()
    })
  }

  before(function(done) {
    server.listen(port, function (err) {
      if (err) return done(err)
      serverWithAuth.listen(portWithAuth, function (err) {
        done(err)
      })
    })
  })
  after(function() {
    server.close()
    serverWithAuth.close()
  })

  describe('sub', function() {
    beforeEach(function(done) {
      client = new WebSocket('http://localhost:' + port)
      client.on('open', done)
    })
    afterEach(function(done) {
      client.close()
      done()
    })
    it('should receive ack in the form `ack $uri`', function(done) {

      var uri = 'http://example.com/myresource'
      client.send('sub ' + uri)
      client.on('message', function (msg) {
        // ws@8 sends Buffer, convert to string
        msg = Buffer.isBuffer(msg) ? msg.toString() : msg
        assert.equal(msg, 'ack ' + uri)
        done()
      })
    })
    it('should receive ack for any resource given', function(done) {

      var uris = [
        'http://example.com/hello',
        'http://example.com/hello/hello.ttl',
        'http://example.com/hello/hello/.acl']

      uris.map(function(uri) {
        client.send('sub ' + uri)
      })

      var msgs = []
      client.on('message', function (msg) {
        // ws@8 sends Buffer, convert to string
        msg = Buffer.isBuffer(msg) ? msg.toString() : msg
        msgs.push(msg)
        if (msgs.length == uris.length) {
          check(msgs, uris, done)
        }
      })
    })

    it('should receive ack even if has already subscribed', function(done) {

      var uris = [
        'http://example.com/hello',
        'http://example.com/hello',
        'http://example.com/hello/hello.ttl',
        'http://example.com/hello/hello.ttl',
        'http://example.com/hello/hello/.acl',
        'http://example.com/hello/hello/.acl']

      uris.map(function(uri) {
        client.send('sub ' + uri)
      })

      var msgs = []
      client.on('message', function (msg) {
        // ws@8 sends Buffer, convert to string
        msg = Buffer.isBuffer(msg) ? msg.toString() : msg
        msgs.push(msg)
        if (msgs.length == uris.length) {
          check(msgs, uris, done)
        }
      })
    })
  })

  describe('pub', function() {
    it('should pub to everyone, independently of the host name', function (done) {
      var urls = [
        'http://example.com/resource.ttl',
        'http://domain.com/resource.ttl',
        '/resource.ttl' ]
      var users = [
        'http://nicola.io/#me',
        'http://timbl.com/#me' ]

      var clients = users.map(function() {
        return new WebSocket('http://localhost:' + port)
      })

      var pubs = []

      utils.connectAll(clients, urls, function() {
        utils.ackAll(clients, function() {
          utils.pubAll(clients, pubs, function() {
            assert.equal(pubs.length, users.length)
            done()
          })
          pubsub.publish('/resource.ttl')
        })
      })
    })

    it('should be received by all the clients subscribed to a resource', function(done) {

      var url = 'http://example.com/resource.ttl'
      var users = [
        'http://nicola.io/#me',
        'http://timbl.com/#me' ]

      var clients = users.map(function() {
        return new WebSocket('http://localhost:' + port)
      })

      var pubs = []

      utils.connectAll(clients, url, function() {
        utils.ackAll(clients, function() {
          utils.pubAll(clients, pubs, function() {
            assert.equal(pubs.length, users.length)
            done()
          })
          pubsub.publish('/resource.ttl')
        })
      })
    })
  })

  describe('authorize callback', function() {
    var authClient
    
    beforeEach(function(done) {
      authClient = new WebSocket('http://localhost:' + portWithAuth)
      authClient.on('open', done)
    })
    
    afterEach(function(done) {
      authClient.close()
      done()
    })
    
    it('should receive ack when authorization allows subscription', function(done) {
      authClient.send('sub ' + allowedUri)
      authClient.on('message', function (msg) {
        assert.equal(msg, 'ack ' + allowedUri)
        done()
      })
    })
    
    it('should receive err when authorization denies subscription', function(done) {
      authClient.send('sub ' + deniedUri)
      authClient.on('message', function (msg) {
        assert.equal(msg, 'err ' + deniedUri + ' forbidden')
        done()
      })
    })
    
    it('should receive err when authorization callback returns error', function(done) {
      var serverWithError = http.createServer()
      var portWithError = 8002
      var pubsubWithError = new WsServer(serverWithError, {
        authorize: function(iri, req, callback) {
          callback(new Error('Authorization failed'))
        }
      })
      
      serverWithError.listen(portWithError, function (err) {
        if (err) return done(err)
        
        var errorClient = new WebSocket('http://localhost:' + portWithError)
        errorClient.on('open', function() {
          errorClient.send('sub http://example.com/test')
          errorClient.on('message', function (msg) {
            assert.equal(msg, 'err http://example.com/test forbidden')
            errorClient.close()
            serverWithError.close()
            done()
          })
        })
      })
    })
  })
})
