import applyDiff from '../helper/apply-diff';

export default class ClientPage {
  constructor() {
    this._list = null;
    this._index = null;
    this._data = null;

    this._handleOpen = () => this._open();
  }

  destroy() {
    this._unbindConnection();
  }

  list(list) {
    if (typeof list === 'undefined') {
      return this._list;
    }

    this._list = list;
    this._bindConnection();

    return this;
  }

  index(index) {
    if (typeof index === 'undefined') {
      return this._index;
    }

    this._index = index;
    return this;
  }

  get(index) {
    return this._data && this._data[index];
  }

  select(callback) {
    if (this._data) {
      if (callback) {
        callback(null, this._data);
      }

      return;
    }

    const request = {
      path: '/' + this._list.name(),
      query: {
        filter: this._list.filter(),
        order: this._list.order(),
        page: this._index
      }
    };

    this._list.connection()
      .request(request, (response) => this._select(response, callback))
      .end();
  }

  change(action, diff) {
    this._data = applyDiff(this._data, diff);
  }

  _bindConnection() {
    this._list.connection().addListener('open', this._handleOpen);
  }

  _unbindConnection() {
    this._list.connection().removeListener('open', this._handleOpen);
  }

  _open() {
    if (this._data) {
      this._data = null;
      this.select();
    }
  }

  _select(response, callback) {
    response.once('data', (data) => {
      const error = response.statusCode === 200 ?
        null : new Error(data);

      if (response.statusCode === 200) {
        this._data = data;
      }

      if (callback) {
        callback(error, data);
      }
    });
  }
}
