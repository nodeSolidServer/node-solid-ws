exports.connectAll = connectAll
exports.ackAll = ackAll
exports.pubAll = pubAll

var parallel = require('run-parallel')

function connectAll(clients, url, done) {
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

function pubAll(clients, pubs, done) {
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
