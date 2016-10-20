export default class Query {
  constructor() {
    this._list = null;
    this._query = null;
    this._authorize = null;
  }

  list(value) {
    this._list = value;
    return this;
  }

  query(value) {
    this._query = value;
    return this;
  }

  authorize(value) {
    this._authorize = value;
    return this;
  }
}
