// Own tests here

const APlusPromise = require("./index");

var sentinel = { sentinel: "sentinel" };

const inner = (reason) => {
  return {
    then: function (onFulfilled, onRejected) {
      onRejected(reason);
    },
  };
};
const yFactory = () => new APlusPromise((resolve) => resolve(inner(sentinel)));
const xFactory = () => {
  return {
    then: function (resolvePromise) {
      resolvePromise(yFactory());
    },
  };
};

const promise = new APlusPromise((_, reject) =>
  reject({ dummy: "dummy" })
).then(null, function onBasePromiseRejected() {
  return xFactory();
});

promise.then(null, function onPromiseRejected(reason) {
  console.log(reason, "result should be true, result: ", reason === sentinel);
});
