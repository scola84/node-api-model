import ModelError from '../../error';
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
    const request = {
      path: '/' + this._list.name(),
      query: {
        filter: this._list.filter(),
        order: this._list.order(),
        page: this._page.index()
      }
    };

    this._list.connection()
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

    this._page.data(data, (error) => {
      callback(error, data, this._page);
    });
  }

  _handleError(error, response, callback) {
    response.removeAllListeners();
    callback(error);
  }
}
