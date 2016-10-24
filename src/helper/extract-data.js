export default function extractData(request, response, next) {
  function data(value) {
    request.removeListener('error', error);
    request.data(value);
    next();
  }

  function error(value) {
    request.removeListener('data', data);
    next(value);
  }

  request.once('data', data);
  request.once('error', error);
}
