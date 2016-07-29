export default class Request {
  constructor() {
    this._list = null;
    this._validate = null;
  }

  list(list) {
    if (typeof list === 'undefined') {
      return this._list;
    }

    this._list = list;
    return this;
  }

  validate(validate) {
    if (typeof validate === 'undefined') {
      return this._validate;
    }

    this._validate = validate;
    return this;
  }
}
