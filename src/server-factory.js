export default class ServerFactory {
  constructor() {
    this._instances = {};
    this._models = {};
  }

  create(name, query) {
    query = Object.assign({
      filter: '',
      order: ''
    }, query);

    const id = query.id || name + query.filter + query.order;

    if (typeof this._instances[id] === 'undefined') {
      this._instances[id] = this._create(name, query).id(id);
    }

    return this._instances[id];
  }

  register(name, object) {
    this._models[name] = object;
    return this;
  }

  _create(name, query) {
    return new this._models[name]()
      .name(name)
      .filter(query.filter)
      .order(query.order);
  }
}
