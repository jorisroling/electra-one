function fuse(name, sub, options) {
  require('./acid.v2').handler('acid.v2', sub, options)
  require('./router').handler('router', sub, options)
}

module.exports = {
  name: 'fuse',
  description: 'To it all',
  handler: fuse,
  aliases:[]
}