import Cell from "./cell.js";
import { grid } from "./defs.js";
import Random from "./random.js";

const GRID = { length: grid.size };

/**
 * private static fields used by Core::move(keyof CoreMoves)
 * @ {
 */

const directions = {
  up: 0b00,
  down: 0b01,
  left: 0b10,
  right: 0b11,
};

const rloop = {
  init: 0,
  cond(i) {
    return i < grid.size;
  },
  step: 1,
};

const loop = {
  init: grid.size - 1,
  cond(i) {
    return i >= 0;
  },
  step: -1,
};

function hget(i, j) {
  return [i, j];
}

function vget(i, j) {
  return [j, i];
}

/**
 * @ }
 */

/**
 * @typedef {object} CoreMoves
 * @property {boolean} up
 * @property {boolean} down
 * @property {boolean} left
 * @property {boolean} right
 *
 * @typedef {[number, number]} Position
 */

export default class Core {
  /** @type {Cell[][]} */
  #grid;
  /** @type {number} */
  #score;
  /** @type {number} */
  #best;
  /** @type {CoreMoves} */
  #moves;
  /** @type {number} */
  #empty;
  /** @type {Random} */
  #rng;

  get seed() {
    return this.#rng.seed;
  }

  /**
   * @type {(keyof CoreMoves)[]}
   */
  get moves() {
    const entries = Object.entries(this.#moves);
    const results = [];
    for (const [key, enabled] of entries) {
      if (enabled) results.push(key);
    }
    return results;
  }

  get score() {
    return this.#score;
  }

  set score(value) {
    this.#score = value;
    if (value > this.#best) this.#best = value;
  }

  get best() {
    return this.#best;
  }

  set best(value) {
    this.#best = value;
  }

  get grid() {
    return this.#grid;
  }

  /**
   * @param {{
   *  (event: 'spawn', payload: {
   *    at: Position, value: number
   *  }) => void;
   *  (event: 'merge', payload: {
   *    from: Position, to: Position, value: number
   *  }) => void;
   *  (event: 'move', payload: {
   *    from: Position, to: Position
   *  }) => void;
   * }} anim
   * @param {number} seed
   */
  constructor(anim, seed) {
    if (anim == null)
      throw new Error('Event subscriber: parameter "anim" is null!');
    this.#grid = Array.from(GRID).map(() => Array.from(GRID));
    this.#rng = new Random(seed);
    this.anim = anim;
    this.scoref = (n) => Math.pow(2, n);
  }

  /**
   * @param {(i: number)=> Cell[]} selector
   * @return {[boolean, boolean]}
   */
  #linear_check(selector) {
    let forward = false,
      backward = false;
    for (let i = 0; i < grid.size; i++) {
      const cells = selector(i);
      let continous_null = 0;
      for (let j = 0; j < grid.size; j++) {
        const cell = cells[j];
        if (cell.is_null) {
          continous_null++;
        } else if (continous_null) {
          if (j === continous_null) {
            backward = true;
            if (forward) return [true, true];
          } else if (j != grid.size) return [true, true];
          continous_null = 0;
        } else if (j && Cell.can_merge(cell, cells[j - 1])) return [true, true];
      }
      if (continous_null && continous_null !== grid.size) {
        forward = true;
        if (backward) return [true, true];
      }
    }
    return [forward, backward];
  }

  #update() {
    const [down, up] = this.#linear_check((y) =>
      Array.from(GRID).map((_, i) => this.#grid[i][y])
    );
    const [right, left] = this.#linear_check((x) => this.#grid[x]);
    this.#moves = { up, down, left, right };
  }

  new_game() {
    this.#score = 0;
    this.#empty = grid.size * grid.size;

    for (const row of this.#grid) row.fill(Cell.Null);
    for (let i = 0; i < grid.start; i++) this.#spawn();
    this.#update();
  }

  #spawn() {
    if (!this.#empty) return;
    let position = this.#rng.next() % this.#empty;
    const power = this.#rng.next() % 10 ? 0 : 1;

    for (let i = 0; i < grid.size; i++) {
      for (let j = 0; j < grid.size; j++) {
        if (this.#grid[i][j].is_null && !position--) {
          this.#grid[i][j] = new Cell(power);
          this.anim("spawn", { at: [j, i], value: power });
          break;
        }
      }
    }

    this.#empty--;
  }

  /**
   * @param {keyof CoreMoves} direction
   */
  move(direction) {
    if (!this.#moves[direction]) return false;

    const flag = directions[direction];
    const g = flag & 0b10 ? hget : vget;
    const l = flag & 0b01 ? loop : rloop;
    this.#empty = 0;

    for (let i = 0; i < grid.size; i++) {
      let j, k;
      for (j = l.init + l.step, k = l.init; l.cond(j); j += l.step) {
        const [this_i, this_j] = g(i, j);
        const [prev_i, prev_j] = g(i, k);
        const merged = Cell.try_merge(
          this.#grid[prev_i][prev_j],
          this.#grid[this_i][this_j]
        );
        if (merged) {
          this.score += this.scoref(merged.power);
          this.#grid[this_i][this_j] = Cell.Null;
          this.#grid[prev_i][prev_j] = merged;
          this.anim("merge", {
            to: [prev_j, prev_i],
            from: [this_j, this_i],
            value: merged.power,
          });
          k = j = j + l.step;
        } else if (!this.#grid[this_i][this_j].is_null) k = j;
      }

      for (j = k = l.init; l.cond(j); j += l.step) {
        const [this_i, this_j] = g(i, j);
        if (this.#grid[this_i][this_j].is_null) {
          this.#empty++;
          continue;
        }
        if (j != k) {
          const [dense_i, dense_j] = g(i, k);
          this.#grid[dense_i][dense_j] = this.#grid[this_i][this_j];
          this.#grid[this_i][this_j] = Cell.Null;
          this.anim("move", {
            from: [this_j, this_i],
            to: [dense_j, dense_i],
          });
        }
        k += l.step;
      }
    }

    this.#spawn();
    this.#update();
    return true;
  }

  get cache() {
    const sb = [];
    for (const row of this.#grid) {
      for (const ceil of row) {
        const c = String.fromCharCode(ceil.is_null ? 122 : 65 + ceil.power);
        sb.push(c);
      }
    }
    return {
      best: this.#best,
      score: this.#score,
      seed: this.#rng.seed,
      empty: this.#empty,
      grid: sb.join(""),
    };
  }

  /**
   * @param {{
   *  (event: 'spawn', payload: {
   *    at: Position, value: number
   *  }) => void;
   *  (event: 'merge', payload: {
   *    from: Position, to: Position, value: number
   *  }) => void;
   *  (event: 'move', payload: {
   *    from: Position, to: Position
   *  }) => void;
   * }} anim
   */
  static from(anim, cache) {
    const core = new Core(anim, cache.seed);
    core.#best = cache.best;
    core.#score = cache.score;
    core.#empty = cache.empty;

    for (let i = 0, p = 0; i < grid.size; i++) {
      const row = core.#grid[i];
      for (let j = 0; j < grid.size; j++) {
        const cc = cache.grid.charCodeAt(p++);
        if (cc === 122) row[j] = Cell.Null;
        else {
          row[j] = new Cell(cc - 65);
          core.anim("spawn", {
            at: [j, i],
            value: row[j].power,
          });
        }
      }
    }

    core.#update();
    return core;
  }
}
