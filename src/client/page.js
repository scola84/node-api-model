import apply from '../helper/apply';

export default class ClientPage {
  constructor() {
    this._list = null;
    this._index = null;
    this._data = null;
  }

  list(list) {
    if (list === 'undefined') {
      return this._list;
    }

    this._list = list;
    return this;
  }

  index(index) {
    if (index === 'undefined') {
      return this._index;
    }

    this._index = index;
    return this;
  }

  select(callback) {
    if (this._data) {
      callback(this._data);
      return;
    }

    this._list.connection().request({
      path: '/' + this._list.name(),
      query: {
        filter: this._list.filter(),
        order: this._list.order(),
        page: this._index
      }
    }, (response) => {
      response.on('data', (data) => {
        this._data = data;
        callback(data);
      });
    }).end();
  }

  change(action, diff) {
    apply(this._data, diff);
  }
}
