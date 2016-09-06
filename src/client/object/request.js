export default class Request {
  constructor() {
    this._object = null;
    this._validate = null;
  }

  object(value) {
    if (typeof value === 'undefined') {
      return this._object;
    }

    this._object = value;
    return this;
  }

  validate(value) {
    if (typeof value === 'undefined') {
      return this._validate;
    }

    this._validate = value;
    return this;
  }
}
