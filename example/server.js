const express = require('express')
const { attachSolidNotificationServer } = require('../serverInjection/serverInjection')

const app = express()

// not sure how to do all this
const solidWs = attachSolidNotificationServer(undefined, app)

app.listen(8080, () => {
  console.log('running on port 8080!')
})
