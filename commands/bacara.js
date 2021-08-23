function bacara(name, sub, options) {
  require('./acid.v2').handler('acid.v2', sub, options)
  require('./router').handler('router', sub, options)
}

module.exports = {
  name: 'bacara',
  description: 'To it all',
  handler: bacara,
  aliases:[]
}