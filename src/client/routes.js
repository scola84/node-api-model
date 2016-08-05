export default function clientRoutes(router, factory, callback) {
  router.pub('/:name', (request, response, next) => {
    request.on('data', (data) => {
      factory
        .model(request.params.name)
        .list(request.query)
        .change(data.action, data.diff, callback);
    });

    next();
  });

  router.pub('/:name/:id', (request, response, next) => {
    request.on('data', (data) => {
      factory
        .model(request.params.name)
        .object(request.params)
        .change(data.action, data.diff, callback);
    });

    next();
  });
}
