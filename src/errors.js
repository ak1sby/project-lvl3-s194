const getErrorMessageByStatus = (err, link) => {
  switch (err.response.status) {
    case 403:
      return `Code: ${err.response.status} Access Denied\nFailed download: ${link}\n`;

    case 404:
      return `Code: ${err.response.status} Resourse Not Found\nFailed download: ${link}\n`;

    case 429:
      return `Code: ${err.response.status} Too Many Requests\nRetry after: ${err.response.headers['retry-after']}\nFailed download: ${link}\n`;

    case 500:
      return `Code: ${err.response.status} Internal Server Error\nFailed download: ${link}\n`;

    case 503:
      return `Code: ${err.response.status} Server Unavailable\nFailed download: ${link}\n`;

    default:
      return `Unknown code: ${err.response.code}`;
  }
};

const getErrorMessageByCode = (err) => {
  switch (err.code) {
    case 'EACCES':
      return 'Permission denied for directory\n';

    case 'ECONNREFUSED':
      return `No connection for ${err.config.url} url\n`;

    case 'ENOTFOUND':
      return `Wrong url address: ${err.config.url}.\n`;

    case 'EEXIST':
      return `File/directory: '${err.path}' already exists.\n`;

    case 'ENOTDIR':
      return `Is not a directory: ${err.path}\n`;

    case 'EISDIR':
      return 'Path is directory\n';

    case 'ENOENT':
      return `No such file/directory: ${err.path}\n`;

    default:
      return `Error code: ${err.code}\n`;
  }
};

export default (err, link) => {
  if (err.response && err.response.status) {
    return getErrorMessageByStatus(err, link);
  } else if (err.code) {
    return getErrorMessageByCode(err);
  }

  return err.message;
};
