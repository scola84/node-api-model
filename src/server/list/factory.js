import ServerList from './list';

export default class ServerListFactory {
  constructor() {
    this._name = null;
    this._model = null;
    this._cache = null;
    this._meta = null;
    this._total = null;
    this._select = null;

    this._authorize = (f, o, l, r, c) => c();
    this._filter = (f, r, c) => c();
    this._order = (o, r, c) => c();
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

  authorize(value) {
    this._authorize = value;
    return this;
  }

  validate(filter, order) {
    this._filter = filter;
    this._order = order;

    return this;
  }

  meta(value) {
    this._meta = value;
    return this;
  }

  select(value) {
    this._select = value;
    return this;
  }

  create(id, params) {
    return new ServerList()
      .id(id)
      .name(this._name)
      .model(this._model)
      .cache(this._cache)
      .authorize(this._authorize)
      .validate(this._filter, this._order)
      .meta(this._meta)
      .select(this._select)
      .filter(params.filter)
      .order(params.order);
  }
}
