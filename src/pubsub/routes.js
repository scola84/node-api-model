export default function pubsubRoutes(router) {
  const connections = {};

  router.sub('/:name', (request, response, next) => {
    const name = request.params.name;
    connections[name] = connections[name] || new Set();

    request.once('data', (action) => {
      if (action === true) {
        connections[name].add(request.connection);

        request.connection.once('close', () => {
          connections[name].delete(request.connection);
        });
      } else if (action === false) {
        connections[name].delete(request.connection);
      }
    });

    next();
  });

  router.pub('/:name/:id', (request, response, next) => {
    const name = request.params.name;
    connections[name] = connections[name] || new Set();

    if (!connections[name].has(request.connection)) {
      return;
    }

    request.once('data', (data) => {
      connections[name].forEach((connection) => {
        connection.request({
          method: 'PUB',
          path: request.path
        }).end(data);
      });
    });

    next();
  });
}
