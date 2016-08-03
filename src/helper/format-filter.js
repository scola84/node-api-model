export default function formatFilter(filter) {
  return Object.keys(filter).map((key) => {
    return key + (key ? ':' : '') + filter[key].map((value) => {
      return value.indexOf(' ') !== -1 ? '"' + value + '"' : value;
    }).join(' ');
  }).join(' ');
}
