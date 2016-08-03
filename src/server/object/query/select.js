import Query from '../query';

export default class SelectQuery extends Query {
  execute(request, callback) {
    this._object.data((error, cacheData) => {
      if (error) {
        callback(error);
        return;
      }

      if (cacheData) {
        callback(null, cacheData, this._object);
        return;
      }

      this._query(request, (queryError, data) => {
        this._handleQuery(queryError, data, callback);
      });
    });
  }

  _handleQuery(error, data, callback) {
    if (error) {
      callback(new Error('500 query_failed ' + error.message));
      return;
    }

    if (!data) {
      callback(new Error('404 not_found ' + this._object.path()));
      return;
    }

    this._object.data(data, (objectError) => {
      callback(objectError, data, this._object);
    });
  }
}
