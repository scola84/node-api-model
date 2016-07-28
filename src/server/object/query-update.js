import odiff from 'odiff';
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

    const changed = Object.assign({}, this._object.data(), data);
    const diff = odiff(changed, this._object.data());

    if (diff.length === 0) {
      if (callback) {
        callback();
      }

      return;
    }

    this._validate(changed, request, (error) => {
      this._handleValidate(error, changed, diff, request, callback);
    });
  }

  _handleValidate(error, changed, diff, request, callback) {
    if (error) {
      if (callback) {
        callback(error);
      }

      return;
    }

    this._query(changed, request, (queryError) => {
      this._handleQuery(queryError, changed, diff, callback);
    });
  }

  _handleQuery(error, changed, diff, callback) {
    if (error) {
      if (callback) {
        callback(error);
      }

      return;
    }

    this._object
      .data(changed)
      .notifyPeers('update', diff);

    if (callback) {
      callback(null, changed, this._object);
    }
  }
}
