import css from "@styles/grid.module.css";
import { grid } from "core-1024/defs.js";
import create_elem, { JammyArch } from "jellyfish";
import create_cell from "./cell";

/**
 * @type {JammyArch}
 */
const grid_arch = {
  name: "grid",
  tag: "div",
  props: [
    {
      name: "className",
      value: css["container"],
    },
  ],
  children: [
    {
      name: "rows",
      tag: "div",
      count: grid.size,
      children: [
        {
          name: "cells",
          ctor: create_cell,
          count: grid.size,
        },
      ],
    },
  ],
};

/**
 * @typedef {import('./cell').CellJammy} CellJammy
 *
 * @typedef {object} GridInternalHandle
 * @property {GridRowsHandle} grid
 *
 * @typedef {object} GridRowsHandle
 * @property {GridRowHandle[]} rows
 *
 * @typedef {object} GridRowHandle
 * @property {CellJammy[]} cells
 */

/**
 * @returns {[
 *  HTMLElement,
 *  {
 *    get: (x: number, y: number) => number,
 *    set: (x: number, y: number, value: number) => void
 *  }
 * ]}
 */
export default function create_grid() {
  /** @type {GridInternalHandle} */
  const managed = {};
  const grid_elem = create_elem(grid_arch, managed);
  const {
    grid: { rows },
  } = managed;

  const jammy = {
    native: grid_elem,
    /**
     * @param {number} x
     * @param {number} y
     */
    get(x, y) {
      return rows[y].cells[x].value;
    },
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} value
     */
    set(x, y, value) {
      rows[y].cells[x].value = value;
    },
    /**
     * @param {number} x
     * @param {number} y
     */
    animate(x, y, { dx = 0, dy = 0 }) {
      const cell_elem = grid_elem.children[y].children[x];
      const anim = cell_elem.animate(
        [{ transform: `translateX(${dx * 100}%) translateY(${dy * 100}%)` }],
        50 * (Math.abs(dx) + Math.abs(dy))
      );
      return new Promise((resolve) => {
        anim.onfinish = resolve;
      });
    },
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} value
     */
    spawn(x, y, value) {
      rows[y].cells[x].spawn(value);
    },
    clear() {
      for (let i = 0; i < grid.size; i++) {
        for (let j = 0; j < grid.size; j++) {
          rows[i].cells[j].value = null;
        }
      }
    },
  };

  return [grid_elem, jammy];
}
