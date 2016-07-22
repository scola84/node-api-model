import odiff from 'odiff';

export default class ServerPage {
  constructor() {
    this._list = null;
    this._index = null;
    this._select = null;
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
    if (!this._select) {
      this._select = callback;
      return this;
    }

    if (this._data) {
      if (callback) {
        callback(null, this._data);
      }

      return this;
    }

    const params = {
      filter: this._list.filter(true),
      order: this._list.order(true),
      limit: {
        offset: this._index * this._list.count(),
        count: this._list.count()
      }
    };

    this._select(params, (error, data) => {
      if (!error) {
        this._data = data;
      }

      callback(error, data);
    });

    return this;
  }

  change(action, diff, id, callback) {
    const copy = [...this._data];
    this._data = null;

    this.select((error, data) => {
      callback(odiff(copy, data));
    });
  }
}
