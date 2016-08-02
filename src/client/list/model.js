import ClientList from './list';

export default class ClientListModel {
  constructor() {
    this._name = null;
    this._model = null;
    this._cache = null;
    this._connection = null;

    this._validate = (d, c) => c();
  }

  name(name) {
    this._name = name;
    return this;
  }

  model(model) {
    this._model = model;
    return this;
  }

  cache(cache) {
    this._cache = cache;
    return this;
  }

  connection(connection) {
    this._connection = connection;
    return this;
  }

  validate(validate) {
    this._validate = validate;
    return this;
  }

  create(id, params) {
    return new ClientList()
      .id(id)
      .name(this._name)
      .model(this._model)
      .cache(this._cache)
      .connection(this._connection)
      .validate(this._validate)
      .filter(params.filter)
      .order(params.order);
  }
}
