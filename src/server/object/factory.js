import ServerObject from './object';

export default class ServerObjectFactory {
  constructor() {
    this._name = null;
    this._model = null;
    this._cache = null;
    this._connection = null;

    this._select = null;
    this._insert = null;
    this._update = null;
    this._delete = null;
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

  select(value) {
    this._select = value;
    return this;
  }

  insert(value) {
    this._insert = value;
    return this;
  }

  update(value) {
    this._update = value;
    return this;
  }

  delete(value) {
    this._delete = value;
    return this;
  }

  create(id) {
    return new ServerObject()
      .id(id)
      .name(this._name)
      .model(this._model)
      .cache(this._cache)
      .connection(this._connection)
      .select(this._select)
      .insert(this._insert)
      .update(this._update)
      .delete(this._delete);
  }
}
