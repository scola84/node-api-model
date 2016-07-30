import data from '../i18n/data';

export default class ClientError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }

  toString(i18n) {
    if (typeof i18n === 'undefined') {
      return this.message;
    }

    const prefix = 'scola.api-model.';
    const string = i18n.string();

    if (!string.get(prefix.slice(0, -1), 'en')) {
      string.data(data);
    }

    const match = this.message.match(/(\w*)(\s(.*))?/);

    if (match) {
      return string.format(prefix + match[1], {
        detail: match[3]
      });
    }

    return this.message;
  }
}
