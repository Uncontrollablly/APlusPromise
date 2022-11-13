const APlusPromise = require("../src/index");

const adapter = {
  deferred() {
    const dfd = {};
    dfd.promise = new APlusPromise((resolve, reject) => {
      dfd.resolve = resolve;
      dfd.reject = reject;
    });
    return dfd;
  },
};

module.exports = adapter;
