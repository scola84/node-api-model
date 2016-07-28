import Query from './query';

export default class SelectQuery extends Query {
  execute(request, callback) {
    if (this._object.data()) {
      if (callback) {
        callback(null, this._object.data());
      }

      return;
    }

    this._query(request, (error, data) => {
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

    if (!data) {
      if (callback) {
        callback(new Error('404 not_found'));
      }

      return;
    }

    this._object.data(data);

    if (callback) {
      callback(null, data, this._object);
    }
  }
}
