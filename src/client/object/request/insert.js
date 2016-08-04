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
    const request = this._object.connection().request({
      method: 'POST',
      path: '/' + this._object.name()
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

    if (response.statusCode !== 201) {
      callback(new Error(data));
      return;
    }

    const id = response.headers.id;

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

  _handleError(error, source, callback) {
    source.removeAllListeners();
    callback(error);
  }
}
