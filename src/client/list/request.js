export default class Request {
  constructor() {
    this._list = null;
  }

  list(list) {
    if (typeof list === 'undefined') {
      return this._list;
    }

    this._list = list;
    return this;
  }
}
