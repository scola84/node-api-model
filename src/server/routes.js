export default function serverRoutes(router, factory, callback) {
  router.pub('/:name/:id', (request, response, next) => {
    request.once('data', (data) => {
      factory
        .model(request.params.name)
        .lists()
        .forEach((list) => {
          list.change(data.action, data.diff, request.params.id, callback);
        });

      factory
        .model(request.params.name)
        .object(request.params)
        .change(data.action, data.diff, callback);
    });

    next();
  });

  router.sub('/:name/:id', (request, response, next) => {
    request.once('data', (action) => {
      factory
        .model(request.params.name)
        .object(request.params)
        .subscribe(request.connection, action);
    });

    next();
  });

  router.sub('/:name', (request, response, next) => {
    request.once('data', (action) => {
      factory
        .model(request.params.name)
        .list(request.query)
        .subscribe(request.connection, action);
    });

    next();
  });
}
