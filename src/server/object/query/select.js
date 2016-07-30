import Query from '../query';

export default class SelectQuery extends Query {
  execute(request, callback = () => {}) {
    if (this._object.data()) {
      callback(null, this._object.data(), this._object);
      return;
    }

    this._query(request, (error, data) => {
      this._handleQuery(error, data, callback);
    });
  }

  _handleQuery(error, data, callback) {
    if (error) {
      callback(new Error('500 query_failed ' + error.message));
      return;
    }

    if (!data) {
      callback(new Error('404 not_found'));
      return;
    }

    this._object.data(data);
    callback(null, data, this._object);
  }
}
