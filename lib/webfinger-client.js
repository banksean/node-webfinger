var sys = require('sys'),
  fs = require('fs'),
  sax = require("sax"),
  http = require("http"),
  events = require("events"),
  url = require("url"),
  xrd = require("./xrd");

/**
 * An async webfinger client.
 * For more info on webfinger:
 * http://code.google.com/p/webfinger/
 *
 * Usage:
 *
 * var fingerPromise = wf.finger(userUri);
 * fingerPromise.addCallback(function(xrdObj) {
 *   // do something with the webfinger XRD for this user
 * });
 *
 * Caveat: currently only works with email addresses.
 *
 * Sean McCullough banksean@gmail.com
 *
 */

var WebFingerClient = function() {};

WebFingerClient.prototype.fetchUrl_ = function(options, callback) {
  var wf = this;
  var request = http.request(options, function(response) {
    sys.puts("status: " + response.statusCode);
    if (response.statusCode == 301 || response.statusCode == 302) {
      // Do a redirect.  Yahoo does this with @yahoo.com addresses
      // but this XRD parser can't grok it yet.
      sys.puts('got redirected to: ' + response.headers['location']);
      return wf.fetchHostMetaCookedUrl_(response.headers['location'], callback);
    }
    var isError = response.statusCode >= 400;
    if (isError) {
      return callback(response.statusCode, null);
    }
    response.setEncoding("utf8");
    var body = "";
    response.on("data", function (chunk) {
      body += chunk;
    });
    response.on("end", function() {
      sys.puts(body);
      var xrdParser = new xrd.XRDParser(false);
      xrdParser.parse(body, callback);
    });
  });
  request.end();
}

WebFingerClient.prototype.fetchFingerData_ = function(urlStr, callback) {
  var fingerUrl = url.parse(urlStr);
  var options = {
    host: fingerUrl.hostname,
    port: fingerUrl.port || 80,
    path: fingerUrl.pathname + fingerUrl.search,
    method: 'GET'
  };
  this.fetchUrl_(options, callback);
};

WebFingerClient.prototype.fetchHostMeta_ = function(host, callback) {
  return this.fetchHostMetaCookedUrl_("http://" + host + "/.well-known/host-meta", callback)
}

WebFingerClient.prototype.fetchHostMetaCookedUrl_ = function(urlStr, callback) {
  var hostMetaUrl = url.parse(urlStr);
  var wf = this;
  var path = hostMetaUrl.pathname;
  if (hostMetaUrl.search) {
    path += hostMetaUrl.search;
  }
  var options = {
    host: hostMetaUrl.hostname,
    port: hostMetaUrl.port || 80,
    path: path,
    method: 'GET'
  };
  this.fetchUrl_(options, callback);
};

WebFingerClient.prototype.finger = function(userUri, callback) {
  var wf = this;
  // parse out the hostname from user id. currently only works for email.
  // TODO: see if node's url class can parse email addresses too.
  var hostName = userUri.split("@")[1];
  this.fetchHostMeta_(hostName,
    function(err, xrdObj) {
      if (err) return callback(err, null);
      var webfingerTemplates = xrdObj.getLinksByRel("lrdd");
      if (webfingerTemplates.length > 0) {
        var webfingerTemplateStr = webfingerTemplates[0].getAttrValues('template')[0];

        var fingerUrl = webfingerTemplateStr.replace(/\{uri\}/, userUri);
        sys.puts("webfinger uri: " + fingerUrl);

        wf.fetchFingerData_(fingerUrl, callback);
      } else {
        callback('no lrdd found', null);
      }
    });
};

exports.WebFingerClient = WebFingerClient;
