import Query from '../query';

export default class MetaQuery extends Query {
  constructor() {
    super();
    this._type = null;
  }

  type(type) {
    this._type = type;
    return this;
  }

  execute(callback, force) {
    this._list.data((error, data) => {
      if (error) {
        callback(error);
        return;
      }

      if (data && force !== true) {
        callback(null, data, this._list);
        return;
      }

      const filter = this._list.filter(true);
      const order = this._list.order(true);

      this._validate(filter, order, (filterError, orderError) => {
        this._handleValidate(filterError, orderError, filter, order, callback);
      });
    });
  }

  _handleValidate(filterError, orderError, filter, order, callback) {
    if (filterError || orderError) {
      callback(new Error('400 invalid_input ' +
        (filterError || orderError).message));
      return;
    }

    this._query(filter, order, (error, data) => {
      this._handleQuery(error, data, callback);
    });
  }

  _handleQuery(error, data, callback) {
    if (error) {
      callback(new Error('500 invalid_query ' + error.message));
      return;
    }

    this._list.data(data, (listError) => {
      callback(listError, data, this._list);
    });
  }
}
