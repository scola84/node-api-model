export default class Query {
  constructor() {
    this._object = null;
    this._query = null;
    this._validate = null;
  }

  object(value) {
    this._object = value;
    return this;
  }

  query(value) {
    this._query = value;
    return this;
  }

  validate(value) {
    this._validate = value;
    return this;
  }
}
