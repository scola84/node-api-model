export default function pubsubRoutes(router, pubsub) {
  router.sub('/:name', (request, response, next) => {
    request.once('data', (action) => {
      pubsub.subscribe(request.param('name'), request.connection(),
        action);
    });

    next();
  });

  router.pub('/:name/:id', (request, response, next) => {
    request.once('data', (data) => {
      pubsub.publish(request.param('name'), request.connection(),
        request.path(), data);
    });

    next();
  });
}
