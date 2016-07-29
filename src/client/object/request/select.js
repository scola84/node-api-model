import Request from '../request';

export default class SelectRequest extends Request {
  execute(callback = () => {}) {
    if (this._object.data()) {
      callback(null, this._object.data(), this);
      return;
    }

    this._request(callback);
  }

  _request(callback) {
    const request = {
      path: '/' + this._object.name() + '/' + this._object.id()
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

    const error = response.statusCode === 200 ?
      null : new Error(data);

    if (response.statusCode === 200) {
      this._object.data(data);
    }

    callback(error, data, this._object);
  }

  _handleError(error, response, callback) {
    response.removeAllListeners();
    callback(error);
  }
}
