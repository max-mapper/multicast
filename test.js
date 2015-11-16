var multicast = require('./')

multicast('foo', function (err, ip) {
  console.log(err, ip)
})