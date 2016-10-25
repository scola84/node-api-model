import parallel from 'async/parallel';
import ClientModel from './model';

export default class ClientFactory {
  constructor() {
    this._cache = null;
    this._connection = null;
    this._models = new Map();
  }

  cache(value) {
    this._cache = value;
    return this;
  }

  connection(value) {
    this._connection = value;
    return this;
  }

  fetch(callback = () => {}, subscribe = false) {
    const models = Array.from(this._models.values());

    parallel(models.map((model) => {
      return (parallelCallback) => {
        model.fetch(parallelCallback, subscribe);
      };
    }), callback);
  }

  model(name) {
    if (!this._models.has(name)) {
      this._models.set(name, new ClientModel()
        .name(name)
        .cache(this._cache)
        .connection(this._connection));
    }

    return this._models.get(name);
  }
}
