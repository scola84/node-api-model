import { ScolaError } from '@scola/error';
import Request from '../request';

export default class SelectRequest extends Request {
  execute(callback = () => {}, force) {
    this._object.data((error, data) => {
      if (error) {
        callback(error);
        return;
      }

      if (data && force !== true) {
        callback(null, data, this._object);
        return;
      }

      this._request(callback);
    });
  }

  _request(callback) {
    const request = this._object.connection().request()
      .path(this._object.path())
      .once('error', callback)
      .end('', (response) => {
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
      callback(new ScolaError(data));
      return;
    }

    this._object.data(data, (error) => {
      callback(error, data, this._object);
    });
  }
}
