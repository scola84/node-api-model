export default class Query {
  constructor() {
    this._list = null;
    this._query = null;
  }

  list(value) {
    this._list = value;
    return this;
  }

  query(value) {
    this._query = value;
    return this;
  }
}
