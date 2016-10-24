import ServerList from './list';

export default class ServerListFactory {
  constructor() {
    this._name = null;
    this._model = null;
    this._cache = null;
    this._meta = null;
    this._total = null;
    this._select = null;
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
      .meta(this._meta)
      .select(this._select)
      .filter(params.filter)
      .order(params.order);
  }
}
