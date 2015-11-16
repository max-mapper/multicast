#!/usr/bin/env node

var Ssdp = require('nat-upnp/lib/nat-upnp/ssdp.js').create
var lookupMdns = require('lookup-multicast-dns')
// var registerMdns = require('register-multicast-dns')

module.exports = function (id, cb) {
  var done = false
  
  lookupMdns(id, function (err, ip) {
    if (err) {
      end()
      return cb(err)
    }
    end()
    if (done) return
    cb(null, ip)
  })

  // todo add error event to ssdp module
  var ssdp = Ssdp()
  var search = ssdp.search("ssdp:npm-multicast-dns:" + id)
  
  search.on('device', function (info, ip) {
    // ignore unsolicited
    var st = info.st || info.ST
    if (st !== id) return

    end()
    if (done) return
    cb(null, ip)
  })

  function end () {
    if (done) return
    ssdp.close()
    done = true
  }
}

// module.exports.register = function (id) {
//
// }
//
// var query = new Buffer('M-SEARCH * HTTP/1.1\r\n' +
//                        'HOST: ' + this.multicast + ':' + this.port + '\r\n' +
//                        'MAN: "ssdp:discover"\r\n' +
//                        'MX: 1\r\n' +
//                        'ST: ' + device + '\r\n' +
//                        '\r\n');
