import odiff from 'odiff';
import SelectQuery from './query/select';

export default class ServerPage {
  constructor() {
    this._index = null;
    this._list = null;

    this._validate = null;
    this._select = null;

    this._data = null;
  }

  index(index) {
    if (typeof index === 'undefined') {
      return this._index;
    }

    this._index = index;
    return this;
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

  data(data) {
    if (typeof data === 'undefined') {
      return this._data;
    }

    this._data = data;
    return this;
  }

  select(select) {
    if (typeof select === 'undefined') {
      return this._select;
    }

    this._select = new SelectQuery()
      .list(this._list)
      .page(this)
      .query(select)
      .validate(this._validate);

    return this;
  }

  change(action, diff, id, callback) {
    const copy = [...this._data];
    this._data = null;

    this.select().execute((error, data) => {
      callback(error, error ? null : odiff(copy, data));
    });
  }
}
