export default class Request {
  constructor() {
    this._list = null;
  }

  list(value) {
    if (typeof value === 'undefined') {
      return this._list;
    }

    this._list = value;
    return this;
  }
}
