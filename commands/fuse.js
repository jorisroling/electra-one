function fuse(name, sub, options) {
  require('./bacara').handler('bacara', sub, options)
  require('./router').handler('router', sub, options)
  require('./virus').handler('virus', 'companion', options)
}

module.exports = {
  name: 'fuse',
  description: 'Combined Bacara & Router & Virus Companion',
  handler: fuse,
  examples: [
    {usage:'electra-one fuse', description:'Starts Bacara sequencer & Router'},
  ],
  aliases:[]
}