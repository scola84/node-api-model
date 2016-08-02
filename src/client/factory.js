import ClientModel from './model';

export default class ClientFactory {
  constructor() {
    this._cache = null;
    this._connection = null;
    this._models = new Map();
  }

  cache(cache) {
    this._cache = cache;
    return this;
  }

  connection(connection) {
    this._connection = connection;
    return this;
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
