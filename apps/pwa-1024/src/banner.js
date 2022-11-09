import css from "@styles/banner.module.css";
import create_elem, { JammyArch, JammyHandle } from "jellyfish";

/**
 * @type {JammyArch}
 */
const banner_arch = {
  name: "shell",
  tag: "div",
  props: [
    {
      name: "className",
      value: css["banner"],
    },
  ],
  children: [
    {
      name: "header",
      tag: "div",
      props: [
        {
          name: "className",
          value: css["header"],
        },
      ],
      children: [
        {
          name: "title",
          tag: "span",
          props: [
            {
              name: "innerText",
              value: "1024",
            },
          ],
        },
      ],
    },
    {
      name: "kernel",
      tag: "div",
      props: [
        {
          name: "className",
          value: css["boards"],
        },
      ],
      children: [
        {
          name: "score",
          ctor: create_score,
          ctor_args: ["SCORE", 0],
        },
        {
          name: "best",
          ctor: create_score,
          ctor_args: ["BEST", 0],
        },
      ],
    },
  ],
};

const score_arch = {
  name: "shell",
  tag: "div",
  props: [
    {
      name: "className",
      value: css["board"],
    },
  ],
  children: [
    {
      name: "name",
      tag: "p",
      props: [
        {
          name: "className",
          value: css["category"],
        },
      ],
    },
    {
      name: "kernel",
      tag: "span",
      props: [
        {
          name: "className",
          value: css["score"],
        },
      ],
    },
  ],
};

/**
 * @typedef {JammyHandle & ScoreBoardKernelHandle} ScoreBoardShellHandle
 *
 * @typedef {object} ScoreBoardKernelHandle
 * @property {JammyHandle} name
 * @property {JammyHandle} kernel
 *
 * @typedef {object} ScoreInternalHandle
 * @property {ScoreBoardShellHandle} shell
 */

/**
 * @param {string} category
 * @param {number} score
 */
function create_score(category, score) {
  /** @type {ScoreInternalHandle} */
  const handle = {};
  const elem = create_elem(score_arch, handle);
  const {
    shell: { kernel, name },
  } = handle;
  name.native.innerText = category;
  kernel.native.innerText = String(score);

  const jammy = {};
  Object.defineProperty(jammy, "value", {
    get: () => {
      return Number(kernel.native.innerText);
    },
    set: (value) => {
      kernel.native.innerText = String(value);
    },
    enumerable: true,
  });

  return [elem, jammy];
}

export default function create_banner() {
  const handle = {};
  const elem = create_elem(banner_arch, handle);
  const scores = handle.shell.kernel;

  const jammy = {};
  for (const key in scores) {
    if (key === "native") continue;
    Object.defineProperty(jammy, key, {
      get: () => {
        return scores[key].value;
      },
      set: (value) => {
        scores[key].value = value;
      },
      enumerable: true,
    });
  }

  return [elem, jammy];
}
