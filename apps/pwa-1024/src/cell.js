import css from "@styles/cell.module.css";
import create_elem, { JammyArch, JammyHandle } from "jellyfish";

/**
 * @type {JammyArch}
 */
const cell_arch = {
  name: "shell",
  tag: "div",
  props: [
    {
      name: "className",
      value: `${css["fadein"]} ${css["shell"]} ${shell_css(0)}`,
    },
  ],
  children: [
    {
      name: "kernel",
      tag: "span",
      props: [
        {
          name: "className",
          value: css["kernel"],
        },
      ],
    },
  ],
};

function shell_css(value) {
  let name = "empty";
  if (value) name = `v${value}`;
  if (name in css) return css[name];
  if (value < 1e4) return css["vx"];
  if (value < 1e5) return css["vxx"];
  return css["vxxx"];
}

function pretty_text(value) {
  if (!value) return "";
  const raw = String(value);
  const OVERFLOW = 5;
  if (raw.length <= OVERFLOW) return raw;

  const length = Math.ceil(raw.length / OVERFLOW);
  const quotient = Math.floor(raw.length / length);
  const remainder = raw.length % length;
  const parts = Array.from({ length: length })
    .fill(quotient)
    .map((v, i) => (i < remainder ? v + 1 : v));

  const result = [];
  let j = 0;
  for (let i = 0; i < parts.length; i++)
    result.push(raw.substring(j, (j += parts[i])));

  return result.join(" ");
}

/**
 * @typedef {object} CellInternalHandle
 * @property {CellShellHandle} shell
 *
 * @typedef {JammyHandle & CellKernelHandle} CellShellHandle
 *
 * @typedef {object} CellKernelHandle
 * @property {JammyHandle} kernel
 */

/**
 * @typedef {object} CellJammy
 * @property {(value: number) => void} spawn
 * @property {number} value
 */

/**
 * @param {number} value
 * @return {[HTMLElement, CellJammy]}
 */
export default function create_cell(value) {
  /** @type {CellInternalHandle} */
  const handle = {};
  const elem = create_elem(cell_arch, handle);
  const {
    shell,
    shell: { kernel },
  } = handle;
  kernel.native.innerText = pretty_text(value);

  const jammy = {
    spawn: (value) => {
      jammy.value = value;
      setTimeout(() => {
        elem.classList.remove(css["fadein"]);
        void elem.clientWidth;
        elem.classList.add(css["fadein"]);
      });
    },
  };
  Object.defineProperty(jammy, "value", {
    get: () => {
      const nospace = kernel.native.innerText.replace(/\s/g, "");
      const value = nospace ? Number(nospace) : null;
      return value;
    },
    set: (value) => {
      const old_value = jammy.value;
      if (old_value === value) return;
      const old_class = shell_css(old_value);
      const new_class = shell_css(value);
      shell.native.classList.replace(old_class, new_class);
      kernel.native.innerText = pretty_text(value);
    },
    enumerable: true,
  });

  return [elem, jammy];
}
