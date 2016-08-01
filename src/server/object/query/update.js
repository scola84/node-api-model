import odiff from 'odiff';
import Query from '../query';

export default class UpdateQuery extends Query {
  execute(request, callback = () => {}) {
    request.once('data', (data) => {
      this._handleData(data, request, callback);
    });

    request.once('error', (error) => {
      this._handleError(error, request, callback);
    });
  }

  _handleError(error, request, callback) {
    request.removeAllListeners();
    callback(new Error('500 request_failed ' + error.message));
  }

  _handleData(data, request, callback) {
    request.removeAllListeners();

    this._object.data((objectError, objectData) => {
      if (objectError) {
        callback(objectError);
        return;
      }

      const changed = Object.assign({}, objectData, data);
      const diff = odiff(objectData, changed);

      if (diff.length === 0) {
        callback();
        return;
      }

      this._validate(changed, request, (error) => {
        this._handleValidate(error, changed, diff, request, callback);
      });
    });
  }

  _handleValidate(error, changed, diff, request, callback) {
    if (error) {
      callback(new Error('400 input_invalid ' + error.message));
      return;
    }

    this._query(changed, request, (queryError) => {
      this._handleQuery(queryError, changed, diff, callback);
    });
  }

  _handleQuery(error, changed, diff, callback) {
    if (error) {
      callback(new Error('500 query_failed ' + error.message));
      return;
    }

    this._object.data(changed, (objectError) => {
      if (objectError) {
        callback(objectError);
        return;
      }

      this._object.notifyPeers('update', diff);
      callback(null, changed, this._object);
    });
  }
}
