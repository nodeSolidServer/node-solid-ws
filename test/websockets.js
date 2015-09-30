var WebSocket = require('ws')
var assert = require('chai').assert
var http = require('http')
var parallel = require('run-parallel')
var SolidWs = require('../')

describe('Solid-ws', function() {
  var server = http.createServer()
  var port = 8000
  var pubsub = SolidWs(server)
  var client

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
      if (err) done(err)
      client = new WebSocket('http://localhost:' + port)
      client.on('open', done)
    })
  })

  describe('sub', function() {
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
  // describe('pub', function() {
  //   describe('delete resource', function() {
      
  //     it('should', function(done) {
  //       server.emit('pub '+ url)

  //       client.onmessage = function(msg) {
  //         assert.ok(msg)
  //         assert.equal('pub ' + url)
  //         done()
  //       }
  //     })
  //   })
  //   describe('patch resource', function() {
      
  //     it('should', function(done) {
  //       server.emit('pub '+ url)

  //       client.onmessage = function(msg) {
  //         assert.ok(msg)
  //         assert.equal('pub ' + url)
  //         done()
  //       }
  //     })
  //   })
  //   describe('put resource', function() {
      
  //     it('should', function(done) {
  //       server.emit('pub '+ url)

  //       client.onmessage = function(msg) {
  //         assert.ok(msg)
  //         assert.equal('pub ' + url)
  //         done()
  //       }
  //     })
  //   })
  //   describe('add resource in folder', function() {
      
  //     it('should', function(done) {
  //       server.emit('pub '+ url)

  //       client.onmessage = function(msg) {
  //         assert.ok(msg)
  //         assert.equal('pub ' + url)
  //         done()
  //       }
  //     })
  //   })
  // })
})
