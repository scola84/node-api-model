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

  _handleError(requestError, request, callback) {
    request.removeAllListeners();
    callback(new ScolaError(requestError, '400 invalid_request'));
  }

  _handleData(data, request, callback) {
    request.removeAllListeners();

    this._object.data((objectError, cacheData) => {
      if (objectError) {
        callback(objectError);
        return;
      }

      const newData = Object.assign({}, cacheData, data);
      const diff = odiff(cacheData, newData);

      if (diff.length === 0) {
        callback();
        return;
      }

      this._validate(newData, request, (validatorError) => {
        this._handleValidate(validatorError, newData, diff, request, callback);
      });
    });
  }

  _handleValidate(validatorError, newData, diff, request, callback) {
    if (validatorError) {
      callback(ScolaError.fromError(validatorError, '400 invalid_input'));
      return;
    }

    this._authorize(newData, request, (authError) => {
      this._handleAuthorize(authError, newData, diff, request, callback);
    });
  }

  _handleAuthorize(authError, newData, diff, request, callback) {
    if (authError) {
      callback(ScolaError.fromError(authError, '401 invalid_auth'));
      return;
    }

    this._query(newData, request, (queryError, queryData) => {
      this._handleQuery(queryError, queryData, diff, callback);
    });
  }

  _handleQuery(queryError, queryData, diff, callback) {
    if (queryError) {
      callback(ScolaError.fromError(queryError, '500 invalid_query'));
      return;
    }

    this._object.data(queryData, (objectError) => {
      if (objectError) {
        callback(objectError);
        return;
      }

      this._object.notifyPeers('update', diff);
      callback(null, queryData, this._object);
    });
  }
}
