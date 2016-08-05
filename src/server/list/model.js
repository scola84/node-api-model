import ServerList from './list';

export default class ServerListModel {
  constructor() {
    this._name = null;
    this._cache = null;
    this._meta = null;
    this._total = null;
    this._select = null;

    this._authorize = (r, c) => c();
    this._filter = (f, c) => c();
    this._order = (o, c) => c();
  }

  name(name) {
    this._name = name;
    return this;
  }

  cache(cache) {
    this._cache = cache;
    return this;
  }

  authorize(authorize) {
    this._authorize = authorize;
    return this;
  }

  validate(filter, order) {
    this._filter = filter;
    this._order = order;

    return this;
  }

  meta(meta) {
    this._meta = meta;
    return this;
  }

  select(select) {
    this._select = select;
    return this;
  }

  create(id, params) {
    return new ServerList()
      .id(id)
      .name(this._name)
      .cache(this._cache)
      .validate(this._filter, this._order)
      .meta(this._meta)
      .select(this._select)
      .filter(params.filter)
      .order(params.order);
  }
}
