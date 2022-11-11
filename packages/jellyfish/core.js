import { JammyArch } from "./arch.js";

/**
 * @typedef {object} JammyHandle
 * @property {HTMLElement} native
 */
var JammyHandle;

/**
 * @typedef {{
 *  [name: JammyArch['name']]: JammyHandle | JammyHandle[]
 * }} JammyManaged
 */
var JammyManaged;

/**
 * @param {JammyArch} arch
 * @param {JammyManaged} managed
 * @return {HTMLElement}
 */
export default function create_elem(arch, managed, seqi = 0) {
  if (arch == null) return null;
  if (arch.ctor) {
    const args =
      typeof arch.ctor_args === "function"
        ? arch.ctor_args(seqi)
        : arch.ctor_args;
    const [root, root_jammy] = arch.ctor.apply(arch, args);
    managed[arch.name] = root_jammy;
    return root;
  }
  const root = document.createElement(arch.tag);
  /** @type {JammyHandle} */
  const handle = {};
  managed[arch.name] = handle;
  handle.native = root;
  for (const prop of arch.props || []) {
    root[prop.name] = prop.value;
  }
  for (const child of arch.children || []) {
    if (child.count) {
      /** @type {JammyHandle[]} */
      const managed_collection = [];
      for (let i = 0; i < child.count; i++) {
        /** @type {JammyManaged} */
        const managed_item = {};
        const elem_item = create_elem(child, managed_item, i);
        managed_collection.push(managed_item[child.name]);
        root.appendChild(elem_item);
      }
      handle[child.name] = managed_collection;
    } else {
      root.appendChild(create_elem(child, handle));
    }
  }
  return root;
}

export { JammyArch, JammyHandle, JammyManaged };
