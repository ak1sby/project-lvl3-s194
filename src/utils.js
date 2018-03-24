import fs from 'mz/fs';
import url from 'url';
import _ from 'lodash';
import path from 'path';
import createDebug from 'debug';

const debugSaving = createDebug('page-loader:save');

const urlToStr = (currentUrl) => {
  const { hostname, pathname } = url.parse(currentUrl);
  const str = `${hostname}${pathname}`;
  const newStr = str.replace(/[^a-zA-Z0-9]+/gi, '-');
  return _.trim(newStr, '-');
};
const getExtFromLink = (link) => {
  const { pathname } = url.parse(link);
  const { ext } = path.parse(pathname);
  return ext;
};

const getFileName = (link) => {
  const { dir, name } = path.parse(link);
  const ext = getExtFromLink(link);
  const newStr = `${urlToStr(dir)}-${name}`;
  return `${(newStr).replace(/[^a-zA-Z0-9]+/gi, '-')}${ext}`;
};

const makeDir = (dirPath, data) => fs.mkdir(dirPath)
  .then(() => {
    debugSaving('Folder was create %s', dirPath);
    return data;
  });

export { urlToStr, getExtFromLink, getFileName, makeDir };
