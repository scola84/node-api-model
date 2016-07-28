import Query from './query';

export default class UpdateQuery extends Query {
  execute(request, callback) {
    request.once('data', (data) => {
      this._handleData(data, request, callback);
    });

    request.once('error', (error) => {
      this._handleError(error, request, callback);
    });
  }

  _handleError(error, request, callback) {
    request.removeAllListeners();

    if (callback) {
      callback(error);
    }
  }

  _handleData(data, request, callback) {
    request.removeAllListeners();

    this._validate(data, request, (error) => {
      this._handleValidate(error, data, request, callback);
    });
  }

  _handleValidate(error, data, request, callback) {
    if (error) {
      if (callback) {
        callback(error);
      }

      return;
    }

    this._query(data, request, (queryError, id) => {
      this._handleQuery(queryError, id, data, callback);
    });
  }

  _handleQuery(error, id, data, callback) {
    if (error) {
      if (callback) {
        callback(error);
      }

      return;
    }

    this._object.model().object({
      id,
      object: this._object
    }, 'insert');

    this._object
      .id(id)
      .data(data)
      .notifyPeers('insert');

    if (callback) {
      callback(null, data, this._object);
    }
  }
}
