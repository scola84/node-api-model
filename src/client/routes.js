export default function clientRoutes(router, factory, callback) {
  router.pub('/:name', (request, response, next) => {
    request.once('error', (error) => {
      request.removeAllListeners();
      next(new Error('400 invalid_request ' + error.message));
    });

    request.once('data', (data) => {
      request.removeAllListeners();
      next();

      factory
        .model(request.param('name'))
        .list(request.query())
        .change(data.action, data.diff, callback);
    });
  });

  router.pub('/:name/:id', (request, response, next) => {
    request.once('error', (error) => {
      request.removeAllListeners();
      next(new Error('400 invalid_request ' + error.message));
    });

    request.once('data', (data) => {
      request.removeAllListeners();
      next();

      factory
        .model(request.param('name'))
        .object(request.params())
        .change(data.action, data.diff, callback);
    });
  });
}
