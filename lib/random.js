/*function genTokenData(projectNum) {
  let data = {};
  let hash = "0x";
  for (var i = 0; i < 64; i++) {
    hash += Math.floor(Math.random() * 16).toString(16);
  }
  data.hash = hash;
  data.tokenId = (projectNum * 1000000 + Math.floor(Math.random() * 1000)).toString();
  return data;
}
*/

function genTokenData(seed) {
  let data = {};
  let hash = "0x";
  for (var i = 0; i < 64; i++) {
    hash += (i<seed.length) ? seed[i] : '0';// Math.floor(Math.random() * 16).toString(16);
  }
  data.hash = hash;
  data.tokenId = seed;//(projectNum * 1000000 + Math.floor(Math.random() * 1000)).toString();
  return data;
}

class Random {
  constructor() {
    this.useA = false;
    let sfc32 = function (uint128Hex) {
      let a = parseInt(uint128Hex.substr(0, 8), 16);
      let b = parseInt(uint128Hex.substr(8, 8), 16);
      let c = parseInt(uint128Hex.substr(16, 8), 16);
      let d = parseInt(uint128Hex.substr(24, 8), 16);
      return function () {
        a |= 0; b |= 0; c |= 0; d |= 0;
        let t = (((a + b) | 0) + d) | 0;
        d = (d + 1) | 0;
        a = b ^ (b >>> 9);
        b = (c + (c << 3)) | 0;
        c = (c << 21) | (c >>> 11);
        c = (c + t) | 0;
        return (t >>> 0) / 4294967296;
      };
    };
    // seed prngA with first half of tokenData.hash
    this.prngA = new sfc32(tokenData.hash.substr(2, 32));
    // seed prngB with second half of tokenData.hash
    this.prngB = new sfc32(tokenData.hash.substr(34, 32));
    for (let i = 0; i < 1e6; i += 2) {
      this.prngA();
      this.prngB();
    }
  }
  // random number between 0 (inclusive) and 1 (exclusive)
  random_dec() {
    this.useA = !this.useA;
    return this.useA ? this.prngA() : this.prngB();
  }
  // random number between a (inclusive) and b (exclusive)
  random_num(a, b) {
    return a + (b - a) * this.random_dec();
  }
  // random integer between a (inclusive) and b (inclusive)
  // requires a < b for proper probability distribution
  random_int(a, b) {
    return Math.floor(this.random_num(a, b + 1));
  }
  // random boolean with p as percent liklihood of true
  random_bool(p) {
    return this.random_dec() < p;
  }
  // random value in an array of items
  random_choice(list) {
    return list[this.random_int(0, list.length - 1)];
  }
}

let tokenData //= genTokenData("0x11ac128f8b54949c12d04102cfc01960fc496813cbc3495bf77aeed738579738");

let R //= new Random()

/*function test() {
debug('R.random_dec %y',R.random_dec())      // Random decimal [0-1)
debug('R.random_num %y',R.random_num(0, 10)) // Random decimal [0-10)
debug('R.random_int %y',R.random_int(0, 10)) // Random integer [0-10]
debug('R.random_bool %y',R.random_bool(0.5))  // Random boolean with probability 0.5
debug('R.random_choice %y',R.random_choice([1, 2, 3]))  // Random choice from a given list. Nice for random from a discreet set like a color palette
}

test()
test()
test()
*/
/*debug(process.env)
 process.exit()
*/

let seed_warning = false
function tokenAvailable() {
  if (!tokenData) {
    if (process.env.SEED) {
      tokenData = genTokenData(process.env.SEED)
      debug('SEED found %y token data %y',process.env.SEED,tokenData)
      R = new Random()
    } else {
      if (!seed_warning) {
        debug('NO SEED available')
      }
      seed_warning=true
    }
  }
  return !!R
}

module.exports = {

  reset() {
    tokenData=null
    R=null
  },

  getRandomFloat() {
    if (tokenAvailable() ) {
      return R.random_dec()
    } else {
      return Math.random()
    }
  },

  getRandomInt(max) {
    if (tokenAvailable() ) {
      return R.random_num(0, max)
    } else {
      return Math.floor(Math.random() * Math.floor(max + 1))
    }
  }


}

