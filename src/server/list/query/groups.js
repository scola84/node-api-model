import Query from '../query';

export default class GroupsQuery extends Query {
  execute(callback = () => {}) {
    this._list.meta('groups', (error, data) => {
      if (error) {
        callback(error);
        return;
      }

      if (data) {
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

    this._list.meta('groups', data, (listError) => {
      callback(listError, data, this._list);
    });
  }
}
