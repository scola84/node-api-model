import ServerObject from './object';

export default class ServerObjectModel {
  constructor() {
    this._name = null;
    this._model = null;
    this._cache = null;
    this._lifetime = null;
    this._connection = null;

    this._authorize = (r, c) => c();
    this._validate = (r, d, c) => c();

    this._select = null;
    this._insert = null;
    this._update = null;
    this._delete = null;
  }

  name(name) {
    this._name = name;
    return this;
  }

  model(model) {
    this._model = model;
    return this;
  }

  cache(cache, lifetime) {
    this._cache = cache;
    this._lifetime = lifetime;

    return this;
  }

  connection(connection) {
    this._connection = connection;
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

  select(select) {
    this._select = select;
    return this;
  }

  insert(insert) {
    this._insert = insert;
    return this;
  }

  update(update) {
    this._update = update;
    return this;
  }

  delete(deleter) {
    this._delete = deleter;
    return this;
  }

  create(id) {
    return new ServerObject()
      .id(id)
      .name(this._name)
      .model(this._model)
      .cache(this._cache, this._lifetime)
      .connection(this._connection)
      .authorize(this._authorize)
      .validate(this._validate)
      .select(this._select)
      .insert(this._insert)
      .update(this._update)
      .delete(this._delete);
  }
}
