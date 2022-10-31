const state = require("./state");
const { isFunction, isObject, createMicroTask } = require("./helpers");

class APlusPromise {
  constructor(executor) {
    this.state = state.PENDING;
    this.value = null;
    this.reason = null;
    this.onFufilledCallbacks = [];
    this.onRejectedCallbacks = [];
    isFunction(executor) &&
      executor(this.resolve.bind(this), this.reject.bind(this));
  }

  resolve(value) {
    if (this.state !== state.PENDING) return;

    // Problem2
    resolutionProcedure(this, value);
  }

  reject(reason) {
    if (this.state !== state.PENDING) return;

    this.state = state.REJECTED;
    this.reason = reason;
    this.arrangeOnRejectedCallbacks();
  }

  then(onFullfilled, onRejected) {
    let promise2 = new APlusPromise();

    // 2.2.2
    if (isFunction(onFullfilled)) {
      this.onFufilledCallbacks.push(() => {
        try {
          // 2.2.7.1
          const x = onFullfilled(this.value);
          resolutionProcedure(promise2, x);
        } catch (e) {
          // 2.2.7.2
          promise2.reject(e);
        }
      });
    } else {
      this.onFufilledCallbacks.push(() => {
        promise2.resolve(this.value);
      });
    }

    // 2.2.3
    if (isFunction(onRejected)) {
      this.onRejectedCallbacks.push(() => {
        try {
          // 2.2.7.1
          const x = onRejected(this.reason);
          resolutionProcedure(promise2, x);
        } catch (e) {
          // 2.2.7.2
          promise2.reject(e);
        }
      });
    } else {
      this.onRejectedCallbacks.push(() => {
        promise2.reject(this.reason);
      });
    }

    if (this.state === state.FULLFILLED) {
      this.arrangeOnFullfilledCallbacks();
    }

    if (this.state === state.REJECTED) {
      this.arrangeOnRejectedCallbacks();
    }

    // 2.2.7
    return promise2;
  }

  arrangeOnFullfilledCallbacks() {
    while (this.onFufilledCallbacks.length) {
      createMicroTask(this.onFufilledCallbacks.shift());
    }
    this.onRejectedCallbacks = [];
  }

  arrangeOnRejectedCallbacks() {
    while (this.onRejectedCallbacks.length) {
      createMicroTask(this.onRejectedCallbacks.shift());
    }
    this.onFufilledCallbacks = [];
  }
}

const resolutionProcedure = (promise, x) => {
  // 2.3.1
  if (promise === x) {
    promise.reject(new TypeError("Promise can not resolve to itself"));
    return;
  }

  // 2.3.2
  if (x instanceof APlusPromise) {
    switch (x.state) {
      case state.FULLFILLED:
        promise.resolve(x.value);
        break;
      case state.REJECTED:
        promise.reject(x.reason);
      default:
        // Problem1
        x.onFufilledCallbacks.push(() => promise.resolve(x.value));
        x.onRejectedCallbacks.push(() => promise.reject(x.reason));
        break;
    }
  }
  // 2.3.3
  else if (isObject(x) || isFunction(x)) {
    // 2.3.3.1/2.3.3.2
    let then;
    try {
      then = x.then;
    } catch (e) {
      promise.reject(e);
    }
    // 2.3.3.3
    if (isFunction(then)) {
      // Problem3 let isResolveCalled = (isRejectCalled = false);
      let isResolveCalled = false,
        isRejectCalled = false;
      const resolvePromise = (y) => {
        if (!isResolveCalled && !isRejectCalled) {
          resolutionProcedure(promise, y);
          isResolveCalled = true;
        }
      };
      const rejectPromise = (r) => {
        if (!isResolveCalled && !isRejectCalled) {
          promise.reject(r);
          isRejectCalled = true;
        }
      };
      try {
        then.call(x, resolvePromise, rejectPromise);
      } catch (e) {
        if (!isResolveCalled && !isRejectCalled) {
          promise.reject(e);
        }
      }
    }
    // 2.3.3.4
    else {
      promise.value = x;
      promise.state = state.FULLFILLED;
      promise.arrangeOnFullfilledCallbacks();
    }
  }
  // 2.3.4
  else {
    promise.value = x;
    promise.state = state.FULLFILLED;
    promise.arrangeOnFullfilledCallbacks();
  }
};

module.exports = APlusPromise;
