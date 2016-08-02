import ModelError from '../../error';
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
    const request = {
      path: this._object.key()
    };

    this._object.connection()
      .request(request, (response) => {
        this._handleResponse(response, callback);
      })
      .end();
  }

  _handleResponse(response, callback) {
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
      callback(new ModelError(data, response.statusCode));
      return;
    }

    this._object.data(data, (error) => {
      callback(error, data, this._object);
    });
  }

  _handleError(error, response, callback) {
    response.removeAllListeners();
    callback(error);
  }
}
