export default class Cell {
  /**
   * @type {number}
   */
  power;

  /**
   * @param {number} power
   */
  constructor(power) {
    this.power = power;
  }

  get is_null() {
    return this === NULL;
  }

  /**
   * @param {Cell} c1
   * @param {Cell} c2
   */
  static can_merge(c1, c2) {
    for (const c of [c1, c2])
      if (c == null) throw Error("cells should not be null!");
    return c1.power === c2.power;
  }

  /**
   * @param {Cell} c1
   * @param {Cell} c2
   * @return {Cell}
   */
  static try_merge(c1, c2) {
    let merged = null;
    try {
      if (this.can_merge(c1, c2)) merged = new Cell(c1.power + 1);
    } finally {
      return merged;
    }
  }

  static get Null() {
    return NULL;
  }
}

const NULL = Object.freeze(new Cell(Symbol("NULL-CELL")));
