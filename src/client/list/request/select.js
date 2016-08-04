import Request from '../request';

export default class SelectRequest extends Request {
  constructor() {
    super();
    this._page = null;
  }

  page(page) {
    if (typeof page === 'undefined') {
      return this._page;
    }

    this._page = page;
    return this;
  }

  execute(callback, force) {
    this._page.data((error, cacheData) => {
      if (error) {
        callback(error);
        return;
      }

      if (cacheData && force !== true) {
        callback(null, cacheData, this._page);
        return;
      }

      const filter = this._list.filter(true);
      const order = this._list.order(true);

      this._validate(filter, order, (filterError, orderError) => {
        this._handleValidate(filterError, orderError, callback);
      });
    });
  }

  _handleValidate(filterError, orderError, callback) {
    if (filterError || orderError) {
      callback(filterError || orderError);
      return;
    }

    this._request(callback);
  }

  _request(callback) {
    const request = this._list.connection().request({
        path: this._list.path(),
        query: {
          filter: this._list.filter(),
          order: this._list.order(),
          page: this._page.index()
        }
      }, (response) => {
        this._handleResponse(request, response, callback);
      });

    request.once('error', (error) => {
      this._handleError(error, request, callback);
    });

    request.end();
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
      callback(new Error(data));
      return;
    }

    this._page.data(data, (error) => {
      callback(error, data, this._page);
    });
  }

  _handleError(error, source, callback) {
    source.removeAllListeners();
    callback(error);
  }
}
