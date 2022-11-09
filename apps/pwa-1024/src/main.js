import css from "@styles/main.module.css";
import create_grid from "./grid";
import create_banner from "./banner";
import create_elem, { JammyArch } from "jellyfish";
import Core from "core-1024";

const app = document.querySelector("#app");

/**
 * @type {JammyArch}
 */
const main_arch = {
  name: "main",
  tag: "div",
  props: [
    {
      name: "className",
      value: css["viewbox"],
    },
  ],
  children: [
    {
      name: "banner",
      ctor: create_banner,
    },
    {
      name: "grid",
      ctor: create_grid,
    },
    {
      name: "new",
      tag: "input",
      props: [
        {
          name: "type",
          value: "button",
        },
        {
          name: "value",
          value: "NEW GAME",
        },
        {
          name: "onclick",
          value: new_game,
        },
        {
          name: "className",
          value: css["ng"],
        },
      ],
    },
  ],
};

const handle = {};
const pow = (n) => Math.pow(2, n);
const main_elem = create_elem(main_arch, handle);
const { main } = handle;
app.appendChild(main_elem);

const anim_queue = {
  spawn: [],
  merge: [],
  move: [],
};

function anim_push_back(event, payload) {
  if (event === "spawn") {
    anim_queue.spawn.push(payload);
  } else if (event === "merge") {
    anim_queue.merge.push(payload);
  } else if (event === "move") {
    anim_queue.move.push(payload);
  }
}
const CACHE_KEY = "core-1024";

async function core_sync() {
  let payload;
  const merges = [];
  while ((payload = anim_queue.merge.shift())) {
    const {
      from: [x1, y1],
      to: [x2, y2],
      value,
    } = payload;
    const promise = main.grid
      .animate(x1, y1, {
        dx: x2 - x1,
        dy: y2 - y1,
      })
      .then(() => {
        main.grid.set(x1, y1, null);
        main.grid.set(x2, y2, pow(value));
      });
    merges.push(promise);
  }
  await Promise.all(merges);

  const moves = [];
  const grid = core.grid;
  while ((payload = anim_queue.move.shift())) {
    const {
      from: [x1, y1],
      to: [x2, y2],
    } = payload;
    const cell = grid[y2][x2];
    const promise = main.grid
      .animate(x1, y1, {
        dx: x2 - x1,
        dy: y2 - y1,
      })
      .then(() => {
        main.grid.set(x1, y1, null);
        main.grid.set(x2, y2, pow(cell.power));
      });
    moves.push(promise);
  }
  await Promise.all(moves);

  while ((payload = anim_queue.spawn.shift())) {
    const {
      at: [x, y],
      value,
    } = payload;
    main.grid.spawn(x, y, pow(value));
  }

  main.banner.best = core.best;
  main.banner.score = core.score;

  localStorage.setItem(CACHE_KEY, JSON.stringify(core.cache));
}

/** @type {Core} */
let core;

function new_core() {
  const scache = localStorage.getItem(CACHE_KEY);
  if (scache) {
    try {
      const cache = JSON.parse(scache);
      core = Core.from(anim_push_back, cache);
      core_sync();
    } catch {
      localStorage.clear();
      new_core();
    }
  } else {
    const seed = Date.now();
    core = new Core(anim_push_back, seed);
    core.best = 0;
    new_game();
  }
}

function new_game() {
  main.grid.clear();
  core.new_game();
  core_sync();
}

function core_move(direction) {
  if (core.move(direction)) {
    core_sync();
  }
}

document.addEventListener("keydown", (event) => {
  const has_modifiers = ["altKey", "ctrlKey", "metaKey", "shiftKey"].some(
    (key) => event[key]
  );
  const key_map = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    w: "up",
    s: "down",
    a: "left",
    d: "right",
  };
  if (has_modifiers) return;
  if (event.key == "r") {
    new_game();
    return;
  }
  core_move(key_map[event.key]);
});

/** @type {HTMLDivElement} */
const grid_elem = main.grid.native;
let touch;

grid_elem.addEventListener("touchstart", (event) => {
  if (event.touches.length > 1) return;
  [touch] = event.touches;
});

grid_elem.addEventListener("touchend", (event) => {
  if (event.touches.length > 1) return;
  const [touch_end] = event.changedTouches;
  const dx = touch_end.pageX - touch.pageX;
  const abs_dx = Math.abs(dx);
  const dy = touch_end.pageY - touch.pageY;
  const abs_dy = Math.abs(dy);
  if (Math.max(abs_dx, abs_dy) < 10) return;
  const direction =
    abs_dx > abs_dy ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
  core_move(direction);
});

new_core();
