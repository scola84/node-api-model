export default class Query {
  constructor() {
    this._list = null;
    this._query = null;
    this._validate = null;
  }

  list(list) {
    this._list = list;
    return this;
  }

  query(query) {
    this._query = query;
    return this;
  }
}
