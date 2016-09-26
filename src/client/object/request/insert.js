import { StringDecoder } from 'string_decoder';
import { ScolaError } from '@scola/error';
import Request from '../request';

export default class InsertRequest extends Request {
  execute(data, callback = () => {}) {
    this._validate(data, (error) => {
      this._handleValidate(error, data, callback);
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
      .method('POST')
      .path('/' + this._object.name())
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
    if (response.status() !== 201) {
      callback(new ScolaError(new StringDecoder().write(data)));
      return;
    }

    const id = response.header('x-put-id');

    if (!id) {
      callback();
      return;
    }

    this._object
      .id(id)
      .data(data, (error) => {
        if (error) {
          callback(error);
          return;
        }

        this._object.model().object({
          id,
          object: this._object
        }, 'insert');

        callback(null, data, this._object);
      });
  }
}
