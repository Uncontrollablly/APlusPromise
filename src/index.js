const state = require("./state");
const { isFunction, isObject, createMicroTasks } = require("./utils");

class APlusPromise {
  constructor(executor) {
    this.state = state.PENDING;
    this.value = null;
    this.reason = null;
    this.onFulfilledCallbacks = [];
    this.onRejectedCallbacks = [];

    executor(this.resolve.bind(this), this.reject.bind(this));
  }

  resolve(value) {
    if (this.state !== state.PENDING) return;
    resolutionProcedure(this, value);
  }

  reject(reason) {
    if (this.state !== state.PENDING) return;
    this.state = state.REJECTED;
    this.reason = reason;
    createMicroTasks(this.onRejectedCallbacks);
  }

  then(onFulfilled, onRejected) {
    const promise2 = new APlusPromise(() => {});
    onFulfilled = isFunction(onFulfilled) ? onFulfilled : (value) => value;
    onRejected = isFunction(onRejected)
      ? onRejected
      : (value) => {
          throw value;
        };

    this.onFulfilledCallbacks.push(() => {
      try {
        const x = onFulfilled(this.value);
        resolutionProcedure(promise2, x);
      } catch (e) {
        promise2.reject(e);
      }
    });
    this.onRejectedCallbacks.push(() => {
      try {
        const x = onRejected(this.reason);
        resolutionProcedure(promise2, x);
      } catch (e) {
        promise2.reject(e);
      }
    });

    if (this.state === state.FULFILLED) {
      createMicroTasks(this.onFulfilledCallbacks);
    }
    if (this.state === state.REJECTED) {
      createMicroTasks(this.onRejectedCallbacks);
    }

    return promise2;
  }
}

const resolutionProcedure = (promise, x) => {
  if (promise === x) {
    promise.reject(new TypeError("Promise can not resolve to itself"));
    return;
  }

  if (x instanceof APlusPromise) {
    switch (x.state) {
      case state.FULFILLED:
        promise.resolve(x.value);
        break;
      case state.REJECTED:
        promise.reject(x.reason);
        break;
      case state.PENDING:
        x.onFulfilledCallbacks.push(() => promise.resolve(x.value));
        x.onRejectedCallbacks.push(() => promise.reject(x.reason));
        break;
      default:
        throw new Error("Promise state error");
    }
    return;
  }

  if (isObject(x) || isFunction(x)) {
    let then;
    try {
      then = x.then;
    } catch (e) {
      promise.reject(e);
    }

    if (isFunction(then)) {
      let isAnyCallbackCalled = false;
      const resolvePromise = (y) => {
        if (!isAnyCallbackCalled) {
          resolutionProcedure(promise, y);
          isAnyCallbackCalled = true;
        }
      };
      const rejectPromise = (r) => {
        if (!isAnyCallbackCalled) {
          promise.reject(r);
          isAnyCallbackCalled = true;
        }
      };

      try {
        then.call(x, resolvePromise, rejectPromise);
      } catch (e) {
        !isAnyCallbackCalled && promise.reject(e);
      }
      return;
    }
  }

  promise.value = x;
  promise.state = state.FULFILLED;
  createMicroTasks(promise.onFulfilledCallbacks);
};

module.exports = APlusPromise;
