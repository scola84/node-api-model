import ClientModel from './model';

export default class ClientFactory {
  constructor() {
    this._connection = null;
    this._models = new Map();
  }

  connection(connection) {
    this._connection = connection;
    return this;
  }

  model(name) {
    if (!this._models.has(name)) {
      this._models.set(name, new ClientModel()
        .name(name)
        .connection(this._connection));
    }

    return this._models.get(name);
  }
}
