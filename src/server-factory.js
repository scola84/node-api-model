export default class ServerFactory {
  constructor() {
    this._listInstances = {};
    this._listModels = {};
  }

  createList(name, query) {
    query = Object.assign({
      filter: '',
      order: ''
    }, query);

    const id = query.id || name + query.filter + query.order;

    if (typeof this._listInstances[id] === 'undefined') {
      this._listInstances[id] = this._createList(name, query).id(id);
    }

    return this._listInstances[id];
  }

  registerList(name, list) {
    this._listModels[name] = list;
    return this;
  }

  _createList(name, query) {
    return new this._listModels[name]()
      .name(name)
      .filter(query.filter)
      .order(query.order);
  }
}
