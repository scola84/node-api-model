export default class Query {
  constructor() {
    this._object = null;
    this._query = null;
  }

  object(value) {
    this._object = value;
    return this;
  }

  query(value) {
    this._query = value;
    return this;
  }
}
