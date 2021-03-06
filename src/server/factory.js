import ServerModel from './model';

export default class ServerFactory {
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

  model(name) {
    if (!this._models.has(name)) {
      this._models.set(name, new ServerModel()
        .name(name)
        .cache(this._cache)
        .connection(this._connection));
    }

    return this._models.get(name);
  }
}
