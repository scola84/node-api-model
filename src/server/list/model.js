import ServerList from './list';

export default class ServerListModel {
  constructor() {
    this._name = null;
    this._cache = null;
    this._lifetime = null;
    this._groups = null;
    this._total = null;
    this._select = null;

    this._authorize = (r, c) => c();
    this._validate = (r, d, c) => c();
  }

  name(name) {
    this._name = name;
    return this;
  }

  cache(cache, lifetime) {
    this._cache = cache;
    this._lifetime = lifetime;
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

  groups(groups) {
    this._groups = groups;
    return this;
  }

  total(total) {
    this._total = total;
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
      .cache(this._cache, this._lifetime)
      .validate(this._validate)
      .groups(this._groups)
      .total(this._total)
      .select(this._select)
      .filter(params.filter)
      .order(params.order);
  }
}
