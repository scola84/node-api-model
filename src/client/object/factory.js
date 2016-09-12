import ClientObject from './object';

export default class ClientObjectFactory {
  constructor() {
    this._name = null;
    this._model = null;
    this._cache = null;
    this._connection = null;

    this._validate = (d, c) => c();
  }

  name(value) {
    this._name = value;
    return this;
  }

  model(value) {
    this._model = value;
    return this;
  }

  cache(value) {
    this._cache = value;
    return this;
  }

  connection(value) {
    this._connection = value;
    return this;
  }

  validate(value) {
    this._validate = value;
    return this;
  }

  create(id) {
    return new ClientObject()
      .id(id)
      .name(this._name)
      .model(this._model)
      .cache(this._cache)
      .connection(this._connection)
      .validate(this._validate);
  }
}
