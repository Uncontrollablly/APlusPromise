const isFunction = (fn) => typeof fn === "function";
const isObject = (x) => x && typeof x === "object";
const createMicroTask = (fn) => {
  const isBrowser =
    typeof window !== "undefined" && typeof window.document !== "undefined";

  if (isBrowser && typeof MutationObserver !== "undefined") {
    const observer = new MutationObserver(fn);
    const node = document.createTextNode("");
    observer.observe(node, { characterData: true });
    node.data = "trigger";
  } else setTimeout(fn, 0);
};
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
