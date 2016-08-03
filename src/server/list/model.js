import ServerList from './list';

export default class ServerListModel {
  constructor() {
    this._name = null;
    this._cache = null;
    this._meta = null;
    this._total = null;
    this._select = null;

    this._authorize = (r, c) => c();
    this._validate = (r, d, c) => c();
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

  validate(validate) {
    this._validate = validate;
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
      .validate(this._validate)
      .meta(this._meta)
      .select(this._select)
      .filter(params.filter)
      .order(params.order);
  }
}
