// TODO: change file structure
const { attachSolidNotificationServer, hasValidJSONLDContentNegotiation } = require('../../serverInjection/serverInjection')
const express = require('express')


const chai = require('chai')
const expect = chai.expect
const sinon = require('sinon')
const dirtyChai = require('dirty-chai')
const sinonChai = require('sinon-chai')
chai.use(dirtyChai)
chai.use(sinonChai)
chai.should()

const httpMocks = require('node-mocks-http')

describe('serverInjection', () => {

    context('attach to server', () => {
        let app
        let server
        before(() => {
            app = express()
            const port = 8080
            server = app.listen(port)
            
        })
        
        it('should render routes to app', () => {
            attachSolidNotificationServer(undefined, app)
            const req = httpMocks.createRequest()
            req.method = "GET"
            req.path = "any/gettable/resource.html"
            const acceptsHeader = "application/ld+json;profile=http://www.w3.org/ns/json-ld#compacted, application/xhtml+xml"
            req.headers = {
                "accept": acceptsHeader 
            }
            const next = sinon.mock()
            const res = httpMocks.createResponse()
            hasValidJSONLDContentNegotiation(req, res, next)
            expect(next).to.have.been.called();
            expect(res.statusCode).to.be.equal(200);
        })

        after(() => {
            server.close();
        })
    })
})