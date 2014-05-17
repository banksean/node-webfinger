var webfinger = require('../lib/webfinger-client')
  , assert = require('assert')
  , sys = require('sys')
  , http = require('http')

var example = http.createServer(function(req, res) {
    if(req.url == '/.well-known/host-meta') {
        res.writeHead(200, {'Content-Type': 'text/xml'})
        return res.end("<?xml version='1.0' encoding='UTF-8'?>"
              + "<XRD xmlns='http://docs.oasis-open.org/ns/xri/xrd-1.0' xmlns:hm='http://host-meta.net/xrd/1.0'>"
              + "  <hm:Host xmlns='http://host-meta.net/xrd/1.0'>localhost:8124</hm:Host>"
              + "  <Link rel='lrdd' template='http://localhost:8124/webfinger/?q={uri}'>"
              + "    <Title>Resource Descriptor</Title>"
              + "  </Link>"
              + "</XRD>")
    }
    if(req.url.match(/^\/webfinger\/\?q\=me\@localhost\:8124/)) {
        res.writeHead(200, {'Content-Type': 'text/html'})
        return res.end("<?xml version='1.0'?>"
              + "<XRD xmlns='http://docs.oasis-open.org/ns/xri/xrd-1.0'>"
              + "        <Subject>acct:me@localhost:8124</Subject>"
              + "        <Alias>http://example.com/profiles/someone</Alias>"
              + "        <Link rel='http://webfinger.net/rel/profile-page' href='http://localhost:8124/profiles/me' type='text/html'/>"
              + "</XRD>")
    }
    res.writeHead(404)
    res.end()
})

example.listen(8124, function() {
    var todo = 3
    var done = function() {if(--todo < 1) example.close()}

    var wf = new webfinger.WebFingerClient()
    // no finger uri
    wf.finger("someone@localhost:8124", function(err, xrdObj) {
        assert.equal(err, 404)
        done()
    })

    // no dns
    wf.finger("someone@plop", function(err, xrdObj) {
        assert.ok(err, 404)
        done()
    })

    wf.finger("me@localhost:8124", function(err, xrdObj) {
        assert.ok(!err)
        var statusLinks = xrdObj.getLinksByRel("http://webfinger.net/rel/profile-page")
        assert.equal(statusLinks[0].attributes[1].value, "http://localhost:8124/profiles/me")
        done()
    })
})


