
const {
  SolidWebsocketNotificationsServer
} = require('../lib/notificationServer')

const JSON_LD_URI_REF = 'http://www.w3.org/ns/json-ld'
const VALID_PROFILE_PARAMETERS = [
  `${JSON_LD_URI_REF}#expanded`,
  `${JSON_LD_URI_REF}#compacted`,
  `${JSON_LD_URI_REF}#context`,
  `${JSON_LD_URI_REF}#flattened`,
  `${JSON_LD_URI_REF}#frame`,
  `${JSON_LD_URI_REF}#framed`
]

function hasJSONLDContentType (req, res, next) {
  const contentType = req.get('content-type')
  console.log(`${contentType}`)
  if (contentType !== undefined && contentType === 'application/ld+json') {
    next()
  } else {
    res.status(422).send(
      JSON.stringify({
        message:
          'content-type header must be of MIME type \'application/ld+json\''
      })
    )
  }
}

function acceptsJSONLD (req, res, next) {
  if (req.accepts('application/ld+json')) {
    next()
  } else {
    customJSONError(
      res,
      422,
      'must accept MIME type \'application/ld+json\''
    ).end()
  }
}

function customJSONError (res, statusCode, message) {
  res.statusMessage = JSON.stringify({ message })
  res.status(statusCode)
  return res
}

function hasValidJSONLDContentNegotiation (req, res, next) {
  const accept = req.get('accept')

  // make sure the 'Accept' header is set in the request
  if (typeof accept !== 'string' || accept === undefined) {
    customJSONError(res, 422, 'accept header not found').end()
  }
  const acceptArray = accept.split(',')
  console.log(acceptArray);

  // if it is not an array, or it is array of length 1, it cannot
  // contain 'application/ld+json' and a 'profile' parameter
  if (!Array.isArray(acceptArray) || acceptArray.length < 2) {
    customJSONError(
      res,
      422,
      'accept header missing profile param and \'application/ld+json\''
    ).end()
  }

  const profile = acceptArray.find((item) => item.includes('profile'))
  console.log(profile)
  if (profile === undefined) {
    customJSONError(
      res,
      415,
      'no profile parameter in accept header identified'
    ).end()
  }
  // at this point the profile parameter should be of the format 'profile='some things''
  // so find the profile param, split it, take the first index, split it again
  const jsonLDProfileParams = profile.split('=')[1].split(' ')
  // if there is just one, then check if the valid parameters
  // include it
  if (
    jsonLDProfileParams.length === 1 &&
    VALID_PROFILE_PARAMETERS.includes(jsonLDProfileParams)
  ) {
    next()
  } else if (
    jsonLDProfileParams.some((param) =>
      VALID_PROFILE_PARAMETERS.includes(param)
    )
  ) {
    next()
  } else {
    customJSONError(
      res,
      415,
      'one or more profile params supplied, but none supported by current subscription server'
    ).end()
  }
  // otherwise check 1 by 1
}

function attachSolidNotificationServer (server, app, opts) {
  const swns = new SolidWebsocketNotificationsServer()

  if (app) {
    app.post('/*', hasJSONLDContentType, (req, res, next) => {
      console.log('post received!')
      res.end()
    })

    app.head('/*', (req, res, next) => {
      console.log('head received!')
      res.end()
    })

    app.options('/*', (req, res, next) => {
      console.log('options received!')
      res.end()
    })

    app.get('/*', acceptsJSONLD, (req, res, next) => {
      console.log('get received!')
      res.end()
    })
  }

  return swns
}

module.exports = {
  attachSolidNotificationServer,
  hasValidJSONLDContentNegotiation,
  customJSONError,
  acceptsJSONLD,
  VALID_PROFILE_PARAMETERS
}
