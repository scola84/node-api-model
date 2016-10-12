import odiff from 'odiff';
import { ScolaError } from '@scola/error';
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
    callback(new ScolaError('400 invalid_request ' + error.message));
  }

  _handleData(data, request, callback) {
    request.removeAllListeners();

    this._object.data((error, cacheData) => {
      if (error) {
        callback(error);
        return;
      }

      const newData = Object.assign({}, cacheData, data);
      const diff = odiff(cacheData, newData);

      if (diff.length === 0) {
        callback();
        return;
      }

      this._validate(newData, request, (validateError) => {
        this._handleValidate(validateError, newData, diff, request, callback);
      });
    });
  }

  _handleValidate(error, changed, diff, request, callback) {
    if (error) {
      callback(ScolaError.fromError(error, '400 invalid_input'));
      return;
    }

    this._query(changed, request, (queryError) => {
      this._handleQuery(queryError, changed, diff, callback);
    });
  }

  _handleQuery(error, changed, diff, callback) {
    if (error) {
      callback(ScolaError.fromError(error, '500 invalid_query'));
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
