export function createStore(initial) {
  const state = { ...initial };
  const subscribers = {};

  return {
    get(key) {
      return state[key];
    },

    set(key, value) {
      const old = state[key];
      state[key] = value;
      if (subscribers[key]) {
        subscribers[key].forEach((fn) => fn(value, old));
      }
    },

    subscribe(key, fn) {
      if (!subscribers[key]) subscribers[key] = [];
      subscribers[key].push(fn);
      return () => {
        subscribers[key] = subscribers[key].filter((f) => f !== fn);
      };
    },

    getState() {
      return state;
    },
  };
}
