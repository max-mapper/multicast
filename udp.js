var thunky = require('thunky')
var dgram = require('dgram')
var events = require('events')

var noop = function () {}

module.exports = function (opts) {
  if (!opts) opts = {}

  var that = new events.EventEmitter()
  var ip = opts.ip
  var port = opts.port
  var type = opts.type || 'udp4'
  
  if (typeof ip === 'undefined' || typeof port === 'undefined') {
    throw new Error('Must specify ip and port')
  }

  if (type === 'udp6' && (!ip || !opts.interface)) {
    throw new Error('For IPv6 multicast you must specify `ip` and `interface`')
  }

  var createSocket = function () {
    var socket = dgram.createSocket({
      type: type,
      reuseAddr: opts.reuseAddr !== false,
      toString: function () {
        return type
      }
    })

    socket.on('error', function (err) {
      that.emit('warning', err)
    })

    socket.on('message', function (message, rinfo) {
      that.emit('message', message, rinfo)
    })

    socket.on('listening', function () {
      if (opts.multicast !== false) {
        socket.addMembership(ip, opts.interface)
        socket.setMulticastTTL(opts.ttl || 255)
        socket.setMulticastLoopback(opts.loopback !== false)
      }
    })

    return socket
  }

  var receiveSocket = createSocket()
  var sendSocket = createSocket()

  var sendBind = thunky(function (cb) {
    sendSocket.on('error', cb)
    sendSocket.bind(0, function () {
      sendSocket.removeListener('error', cb)
      cb(null, sendSocket)
    })
  })

  receiveSocket.bind(port, function () {
    that.emit('ready')
  })

  that.send = function (packet, cb) {
    if (!cb) cb = noop
    sendBind(function (err, socket) {
      if (err) return cb(err)
      sendSocket.send(packet, 0, packet.length, port, ip, cb)
    })
  }

  that.destroy = function (cb) {
    if (!cb) cb = noop
    sendSocket.once('close', function () {
      receiveSocket.once('close', cb)
      receiveSocket.close()
    })
    sendSocket.close()
  }

  return that
}
