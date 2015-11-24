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
