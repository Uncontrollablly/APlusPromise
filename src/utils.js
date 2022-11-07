const isFunction = (fn) => typeof fn === "function";
const isObject = (x) => x && typeof x === "object";
const createMicroTask = (fn) => setTimeout(fn, 0);
const createMicroTasks = (tasks) => {
  while (tasks.length) {
    createMicroTask(tasks.shift());
  }
};

module.exports = {
  isFunction,
  isObject,
  createMicroTasks,
};
