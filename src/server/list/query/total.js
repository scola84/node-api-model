import Query from '../query';

export default class TotalQuery extends Query {
  execute(callback = () => {}) {
    this._list.meta('total', (error, data) => {
      if (error) {
        callback(error);
        return;
      }

      if (data) {
        callback(null, data, this._list);
        return;
      }

      const filter = this.filter(true);
      const order = this.order(true);

      this._validate(filter, order, (filterError, orderError) => {
        this._handleValidate(filterError, orderError, filter, order, callback);
      });
    });
  }

  _handleValidate(filterError, orderError, filter, order, callback) {
    if (filterError || orderError) {
      callback(new Error('400 input_invalid ' +
        (filterError || orderError).message));
      return;
    }

    this._query(filter, order, (error, data) => {
      this._handleQuery(error, data, callback);
    });
  }

  _handleQuery(error, data, callback) {
    if (error) {
      callback(new Error('500 query_failed ' + error.message));
      return;
    }

    this._list.meta('total', data.total, (listError) => {
      callback(listError, data.total, this._list);
    });
  }
}
