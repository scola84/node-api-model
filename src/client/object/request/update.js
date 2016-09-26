import odiff from 'odiff';
import { StringDecoder } from 'string_decoder';
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
    const request = this._object.connection().request()
      .method('PUT')
      .path(this._object.path())
      .once('error', (error) => {
        request.removeAllListeners();
        callback(new ScolaError('000 invalid_request ' + error.message));
      });

    request.end(data, (response) => {
      if (response.status() === 0) {
        return;
      }

      request.removeAllListeners();
      this._handleResponse(response, callback);
    });
  }

  _handleResponse(response, callback) {
    response.once('data', (data) => {
      response.removeAllListeners();
      this._handleData(data, response, callback);
    });

    response.once('error', (error) => {
      response.removeAllListeners();
      callback(error);
    });
  }

  _handleData(data, response, callback) {
    if (response.status() !== 200) {
      callback(new ScolaError(new StringDecoder().write(data)));
      return;
    }

    this._object.data(data, (error) => {
      callback(error, data, this._object);
    });
  }
}
