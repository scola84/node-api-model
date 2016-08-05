import ClientList from './list';

export default class ClientListModel {
  constructor() {
    this._name = null;
    this._model = null;
    this._cache = null;
    this._connection = null;

    this._translate = (f) => f;
    this._filter = (f, c) => c();
    this._order = (o, c) => c();
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

  translate(translate) {
    this._translate = translate;
    return this;
  }

  validate(filter, order) {
    this._filter = filter;
    this._order = order;

    return this;
  }

  create(id, params) {
    return new ClientList()
      .id(id)
      .name(this._name)
      .model(this._model)
      .cache(this._cache)
      .connection(this._connection)
      .translate(this._translate)
      .validate(this._filter, this._order)
      .filter(params.filter)
      .order(params.order);
  }
}
