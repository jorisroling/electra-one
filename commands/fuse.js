function fuse(name, sub, options) {
  require('./bacara').handler('bacara', sub, options)
  require('./router').handler('router', sub, options)
}

module.exports = {
  name: 'fuse',
  description: 'Combined Bacara & Router',
  handler: fuse,
  examples: [
    {usage:'electra-one fuse', description:'Starts Bacara sequencer & Router'},
  ],
  aliases:[]
}