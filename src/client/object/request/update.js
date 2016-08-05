import odiff from 'odiff';
import { ScolaError } from '@scola/error';
import Request from '../request';

export default class UpdateRequest extends Request {
  execute(data, callback = () => {}) {
    this._object.data((error, cacheData) => {
      const newData = Object.assign({}, cacheData, data);
      const diff = odiff(cacheData, newData);

      if (diff.length === 0) {
        callback();
        return;
      }

      this._validate(newData, (validateError) => {
        this._handleValidate(validateError, newData, callback);
      });
    });
  }

  _handleValidate(error, data, callback) {
    if (error) {
      callback(error);
      return;
    }

    this._request(data, callback);
  }

  _request(data, callback) {
    const request = this._object.connection().request({
      method: 'PUT',
      path: this._object.path()
    }, (response) => {
      this._handleResponse(request, response, callback);
    });

    request.once('error', (error) => {
      this._handleError(error, request, callback);
    });

    request.end(data);
  }

  _handleResponse(request, response, callback) {
    request.removeAllListeners();

    response.once('data', (data) => {
      this._handleData(data, response, callback);
    });

    response.once('error', (error) => {
      this._handleError(error, response, callback);
    });
  }

  _handleData(data, response, callback) {
    response.removeAllListeners();

    if (response.statusCode !== 200) {
      callback(new ScolaError(data));
      return;
    }

    this._object.data(data, (error) => {
      callback(error, data, this._object);
    });
  }

  _handleError(error, source, callback) {
    source.removeAllListeners();
    callback(error);
  }
}
