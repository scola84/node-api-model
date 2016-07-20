import ServerObject from './object';

export default class ServerObjectModel {
  constructor() {
    this._model = null;
    this._select = null;
    this._insert = null;
    this._update = null;
    this._delete = null;
  }

  model(model) {
    this._model = model;
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
      .model(this._model)
      .select(this._select)
      .insert(this._insert)
      .update(this._update)
      .delete(this._delete);
  }
}
