export default class Query {
  constructor() {
    this._object = null;
    this._query = null;
    this._authorize = null;
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

  authorize(value) {
    this._authorize = value;
    return this;
  }

  validate(value) {
    this._validate = value;
    return this;
  }
}
