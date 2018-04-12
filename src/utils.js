import fs from 'mz/fs';
import url from 'url';
import _ from 'lodash';
import axios from 'axios';
import cheerio from 'cheerio';
import Listr from 'listr';
import path from 'path';
import createDebug from 'debug';
import getErrorMessage from './errors';

const debug = createDebug('page-loader:other');
const debugSaving = createDebug('page-loader:save');

export const linkToStr = (link) => {
  const { hostname, pathname } = url.parse(link);
  const str = hostname ? `${hostname}${pathname}` : pathname;
  const newStr = str.replace(/[^a-zA-Z0-9]+/gi, '-');
  const result = _.trim(newStr, '-');
  return result;
};

export const getPaths = (curenttURL, outputPath) => {
  const pageName = `${linkToStr(curenttURL)}.html`;
  const pagePath = path.join(outputPath, pageName);
  const dirName = `${linkToStr(curenttURL)}_files`;
  const dirPath = path.join(outputPath, dirName);
  return {
    outputPath, pageName, pagePath, dirName, dirPath,
  };
};

export const normalizeStrLength = (str, length) =>
  (str.length > length ? str.slice(0, length) : str);

export const getExtFromLink = (link) => {
  const { pathname } = url.parse(link);
  if (pathname) {
    const { ext } = path.parse(pathname);
    return ext || '.html';
  }
  return '.html';
};

export const getFileName = (link) => {
  const { dir, name } = path.parse(link);
  const ext = getExtFromLink(link);
  const normalizedDir = normalizeStrLength(dir ? `${linkToStr(dir)}` : '', 100);
  const normalizedName = normalizeStrLength(name, 100);
  const normilizedStr = _.trim(`${normalizedDir}-${normalizedName}`, '-');
  return `${(normilizedStr).replace(/[^a-zA-Z0-9]+/gi, '-')}${ext}`;
};

export const normalizeURL = (link, templateURL) => {
  const linkHostName = url.parse(link).hostname;
  return !linkHostName ? url.resolve(templateURL, link) : link;
};

export const makeDir = dirPath => fs.mkdir(dirPath)
  .then(() => {
    debugSaving('Folder was create %s', dirPath);
  });

export const writeFile = (filePath, data) => fs.writeFile(filePath, data)
  .then(() => {
    debugSaving('File was create %s', filePath);
  });

export const linkToLocalPath = (link, templateURL, dirName) => {
  const normalizedURL = normalizeURL(link, templateURL);
  if (link === '/') {
    return `${linkToStr(normalizedURL)}.html`;
  }
  const fileName = getFileName(normalizedURL);
  const localPath = path.join(dirName, fileName);
  return localPath;
};

export const getResourcesLinks = (targetURL, tagsAttr) => axios.get(targetURL)
  .then(response => cheerio.load(response.data))
  .then(($) => {
    const arrayOfLinks = Object.keys(tagsAttr).map(tag => $(tag)
      .map((i, e) => tagsAttr[tag].map(attrElem => ($(e).attr(attrElem)))).get());
    const resourcesLinks = _.union(_.flatten(arrayOfLinks)).filter(f1 => f1);
    return { resourcesLinks, $ };
  });

export const getPercentOfsuccess = (array) => {
  const arrayWithTrueValues = array.filter(e => e);
  const percentOfsuccess = ((arrayWithTrueValues.length / array.length) * 100).toFixed(1);
  return console.log(` > Downloaded: ${arrayWithTrueValues.length} of ${array.length} (${percentOfsuccess} %)`);
};

export const resourcesLinkstoLocal = (targetURL, outputPath, tagsAttr, data) => {
  const { resourcesLinks, $ } = data;
  const { pagePath, dirName } = getPaths(targetURL, outputPath);
  const tagsAttrPlus = Object.assign({ a: ['href'] }, tagsAttr);
  const newHtml = Object.keys(tagsAttrPlus)
    .reduce((acc, tag) => {
      $(tag).each((i, e) => {
        const arrayOfLinks = tagsAttrPlus[tag].map(attrElem => ($(e).attr(attrElem)));
        const link = arrayOfLinks.filter(f1 => f1) ? arrayOfLinks.filter(f1 => f1)[0] : '';
        if (link) {
          const localPath = tag === 'a' ? linkToLocalPath(link, targetURL, '') : linkToLocalPath(link, targetURL, dirName);
          tagsAttrPlus[tag].map(attrElem => ($(e).attr(attrElem, localPath)));
          debug(`Change URL from: ${link}\nTo local path: ${localPath}\n`);
        }
      });
      return $.html();
    }, $);
  return writeFile(pagePath, newHtml)
    .then(() => resourcesLinks);
};

export const makeTask = (fn, message, ...argts) => {
  const [head] = argts;
  const result = fn(...argts)
    .catch(err => console.error(getErrorMessage(err, head)));
  return new Listr([
    {
      title: `${message}: ${head}`,
      task: () => result,
    },
  ])
    .run(result);
};

