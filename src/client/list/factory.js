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

  translate(value) {
    this._translate = value;
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
