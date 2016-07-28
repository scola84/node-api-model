import Query from './query';

export default class TotalQuery extends Query {
  execute(callback) {
    if (this._list.meta('total')) {
      if (callback) {
        callback(null, {
          count: this._list.count(),
          total: this._list.meta('total')
        });
      }

      return;
    }

    const filter = this.filter(true);
    const order = this.order(true);

    this._validate(filter, order, (filterError, orderError) => {
      this._handleValidate(filterError, orderError, filter, order, callback);
    });
  }

  _handleValidate(filterError, orderError, filter, order, callback) {
    if (filterError || orderError) {
      if (callback) {
        callback(filterError || orderError);
      }

      return;
    }

    this._query(filter, order, (error, data) => {
      this._handleQuery(error, data, callback);
    });
  }

  _handleQuery(error, data, callback) {
    if (error) {
      if (callback) {
        callback(error);
      }

      return;
    }

    this._list.meta('total', data.total);

    if (callback) {
      callback(null, {
        count: this._list.count(),
        total: data.total
      });
    }
  }
}
