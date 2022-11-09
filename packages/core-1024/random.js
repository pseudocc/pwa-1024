const primes = [1129, 65521];
const max_i32 = 2147483647;

export default class Random {
  /** @type {number} */
  seed;
  constructor(seed = 0) {
    this.seed = seed;
  }
  next() {
    this.seed = (primes[1] * this.seed + primes[0]) % max_i32;
    return this.seed;
  }
}
