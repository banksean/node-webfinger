# node webfinger

An asynchronous webfinger client for [node](http://nodejs.org/).  It returns an [XRD](http://hueniverse.com/2009/11/xrd-alignment-with-link-syntax/) object, given an email address.

## Usage

    var webfinger = require('webfinger');
    var wf = new webfinger.WebFingerClient();
    wf.finger("foo@example.com",
      function(err, xrdObj) {
        if (err) throw err;
        var statusLinks = xrdObj.getLinksByRel("http://schemas.google.com/g/2010#updates-from");
        // do something with statusLinks
      }
    );

## Example app

From the top level directory of this project, run

    $ node webfinger-buzz.js <username>@gmail.com

and the application will output the latest google public Buzz entry from that user.

## Test

    node tests/webfinger.js

## TODO

Fix up the XRD and Atom parsers. Currently doesn't work on Yahoo's XRD, for example.
