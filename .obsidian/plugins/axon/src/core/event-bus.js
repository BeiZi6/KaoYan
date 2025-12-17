(() => {
  // src/core/event-bus.ts
  var SimpleEventBus = class {
    events = /* @__PURE__ */ new Map();
    on(event, callback) {
      if (!this.events.has(event)) {
        this.events.set(event, []);
      }
      this.events.get(event).push(callback);
    }
    off(event, callback) {
      const callbacks = this.events.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    }
    emit(event, data) {
      const callbacks = this.events.get(event);
      if (callbacks) {
        callbacks.forEach((callback) => callback(data));
      }
    }
    clear() {
      this.events.clear();
    }
  };
})();
