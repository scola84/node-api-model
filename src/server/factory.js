import ServerModel from './model';

export default class ServerFactory {
  constructor() {
    this._cache = null;
    this._lifetime = null;
    this._connection = null;
    this._models = new Map();
  }

  cache(cache, lifetime = 60000) {
    this._cache = cache;
    this._lifetime = lifetime;

    return this;
  }

  connection(connection) {
    this._connection = connection;
    return this;
  }

  model(name) {
    if (!this._models.has(name)) {
      this._models.set(name, new ServerModel()
        .name(name)
        .cache(this._cache, this._lifetime)
        .connection(this._connection));
    }

    return this._models.get(name);
  }
}
