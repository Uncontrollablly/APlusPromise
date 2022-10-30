const isFunction = (fn) => typeof fn === "function";
const isObject = (x) => x && typeof x === "object";

const createMicroTask = (fn) => setTimeout(fn, 0);

module.exports = {
  isFunction,
  isObject,
  createMicroTask,
};
