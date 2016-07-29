export default class Request {
  constructor() {
    this._object = null;
    this._validate = null;
  }

  object(object) {
    if (typeof object === 'undefined') {
      return this._object;
    }

    this._object = object;
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
