# solid-ws
[![](https://img.shields.io/badge/project-Solid-7C4DFF.svg?style=flat-square)](https://github.com/solid/solid)

> Node/Javascript implementation of Websockets for Solid

## Usage

### Simple way

```javascript

var ldnode = require('ldnode')

var server = ldnode.createServer({live: true})

server.listen(port, function () {
  console.log('Solid server started')
})
```

### Short way 

```javascript
var SolidWs = require('solid-ws')
var ldnode = require('ldnode')

var server = ldnode.createServer()
solidWs(server)

server.listen(port, function () {
  console.log('Solid server started')
})
```

### Long way

```javascript
var SolidWs = require('solid-ws')
var ldnode = require('ldnode')
var express = require('express')
var https = require('https')

var app = express()
app.use('/databox', ldnode())
var server = https.createServer({/* your settings*/}, app)

server.listen(port, function () {
  console.log('Solid server started')
})

// Attach WS to solid
solidWs(server, app)
```

### With authorization

You can pass an `authorize` callback to control which subscriptions are allowed:

```javascript
var SolidWs = require('solid-ws')

var solidWs = SolidWs(server, app, {
  authorize: function (iri, req, callback) {
    // iri: the resource URL being subscribed to
    // req: the HTTP upgrade request (for auth headers/cookies)
    // callback(err, allowed): call with allowed=true to permit, false to deny

    checkUserAccess(iri, req, function (err, hasAccess) {
      callback(err, hasAccess)
    })
  }
})
```

If authorization fails, the client receives `err <url> forbidden` instead of `ack`.
