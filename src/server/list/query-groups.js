import Query from './query';

export default class GroupsQuery extends Query {
  execute(callback) {
    if (this._list.meta('groups')) {
      if (callback) {
        callback(null, {
          count: this._list.count(),
          groups: this._list.meta('groups')
        });
      }

      return;
    }

    const filter = this._list.filter(true);
    const order = this._list.order(true);

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

    this._list.meta('groups', data);

    if (callback) {
      callback(null, {
        count: this._list.count(),
        groups: data
      });
    }
  }
}
