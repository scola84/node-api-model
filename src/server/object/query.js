export default class Query {
  constructor() {
    this._object = null;
    this._query = null;
    this._validate = null;
  }

  object(object) {
    this._object = object;
    return this;
  }

  query(query) {
    this._query = query;
    return this;
  }

  validate(validate) {
    this._validate = validate;
    return this;
  }
}
