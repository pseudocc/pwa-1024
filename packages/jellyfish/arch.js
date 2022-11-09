/**
 * @typedef {object} JammyProp
 * @property {keyof HTMLElement} name
 * @property {any} value
 *
 * @typedef {object} JammyArch
 * @property {keyof HTMLElementTagNameMap} tag
 * @property {((...any) => [HTMLElement, any])?} ctor
 * @property {((i: number) => any[]) | any[]| undefined} ctor_args
 * @property {string} name
 * @property {number?} count
 * @property {JammyProp[]} props
 * @property {Jammy[]} children
 */
var JammyArch;

export { JammyArch };
