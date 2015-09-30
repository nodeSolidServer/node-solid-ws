var WebSocket = require('ws')
var assert = require('chai').assert
var http = require('http')
var parallel = require('run-parallel')
var SolidWs = require('../')
var EventEmitter = require('events').EventEmitter

describe('Solid-ws', function() {
  var server = http.createServer()
  var port = 8000
  var pubsub = SolidWs(server)

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
      done(err)
    })
  })
  after(function() {
    server.close()
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
        msgs.push(msg)
        if (msgs.length == uris.length) {
          check(msgs, uris, done)
        }
      })
    })
  })

  describe('pub', function() {
    it('should be received by all the clients subscribed to a resource', function(done) {

      var url = 'http://example.com/resource.ttl'
      var users = [
        'http://nicola.io#me',
        'http://timbl.com#me', 
        'http://deiu.io#me' ]

      var clients = users.map(function() {
        return new WebSocket('http://localhost:' + port)
      })

      var pubs = []
      var workflow = new EventEmitter()
      workflow.on('done', function () {
        assert.equal(pubs.length, users.length)
        done()
      })

      connectAll(clients, function() {
        ackAll(clients, function() {
          pubAll(clients, function() {
            done()
          })
          pubsub.publish(url)
        })
      })

      function connectAll(clients, done) {
        parallel(clients.map(function(client) {
          return function (cb) {
            client.on('open', function() {
              client.send('sub ' + url)
              cb()
            })
          }
        }), done)
      }

      function ackAll(clients, done) {
        parallel(clients.map(function(client) {
          return function (cb) {
            client.on('message', function (msg) {
              if (msg.split(' ')[0] === 'ack') {
                cb()
                return;
              }
            })
          }
        }), done)
      }

      function pubAll(clients, done) {
        parallel(clients.map(function(client) {
          return function (cb) {
            client.on('message', function (msg) {
              if (msg.split(' ')[0] === 'pub') {
                pubs.push(msg)
                cb()
                return;
              }
            })
          }
        }), done)
      }

    })
  })
})