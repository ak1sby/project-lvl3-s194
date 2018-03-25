import fs from 'mz/fs';
import path from 'path';
import process from 'process';
import axios from 'axios';
import cheerio from 'cheerio';
import _ from 'lodash';
import createDebug from 'debug';
import Listr from 'listr';
import { urlToStr, getFileName, makeDir, writeFile, normalizeURL } from './utils';
import getErrorMessage from './errors';

const debug = createDebug('page-loader:other');

const TagsAttr = {
  img: 'src',
  link: 'href',
  script: 'src',
};

const downloadFile = (fileURL, dirPath) => {
  const fileName = getFileName(fileURL);
  const filePath = path.resolve(dirPath, fileName);
  return axios.get(fileURL, { responseType: 'stream' })
    .then((response) => {
      response.data.pipe(fs.createWriteStream(filePath));
    });
};

const makeLoadTask = (fileURL, dirPath) => new Listr([
  {
    title: `Loading: ${fileURL}`,
    task: () => downloadFile(fileURL, dirPath)
      .catch(err => Promise.reject(console.error(getErrorMessage(err, fileURL)))),
  },
]);

const getPercentOfsuccess = (array) => {
  const arrayWithTrueValues = array.filter(e => e);
  const percentOfsuccess = (arrayWithTrueValues.length / array.length) * 100;
  return console.log(`Downloaded : ${arrayWithTrueValues.length} of ${array.length} (${percentOfsuccess} %)`);
};

const getResourcesLinks = ($) => {
  const arrayOfLinks = Object.keys(TagsAttr).map(tag => $(tag)
    .map((i, e) => ($(e).attr(TagsAttr[tag]))).get());
  const normalizedArrayOfLinks = _.union(_.flatten(arrayOfLinks));
  return normalizedArrayOfLinks;
};

const downloadAllResources = (targetURL, pathForLoading, $) => {
  const arrayOfLinks = getResourcesLinks($);
  const arrayOfURLs = arrayOfLinks.map(link => normalizeURL(link, targetURL));
  return Promise.all(arrayOfURLs
    .map((currentURL) => {
      const loadTask = makeLoadTask(currentURL, pathForLoading);
      return loadTask.run()
        .then(() => true)
        .catch(() => false);
    }))
    .then(loadingResultsArray => getPercentOfsuccess(loadingResultsArray))
    .then(() => $);
};

const linkToLocalPath = (link, templateURL, dirName) => {
  const normalizedURL = normalizeURL(link, templateURL);
  const fileName = getFileName(normalizedURL);
  const localPath = path.join(dirName, fileName);
  return localPath;
};

const resourcesLinkstoLocal = ($, templateURL, dirName) => Object.keys(TagsAttr)
  .reduce((acc, tag) => {
    $(tag).each((i, e) => {
      const link = $(e).attr(TagsAttr[tag]);
      if (link) {
        const localPath = linkToLocalPath(link, templateURL, dirName);
        $(e).attr(TagsAttr[tag], localPath);
        debug(`Change URL from: ${link}\nTo local path: ${localPath}\n`);
      }
    });
    return $.html();
  }, $);

export default (targetURL, outputPath = process.cwd()) => {
  const pageName = `${urlToStr(targetURL)}.html`;
  const dirName = `${urlToStr(targetURL)}_files`;
  const pagePath = path.join(outputPath, pageName);
  const dirPath = path.join(outputPath, dirName);
  return makeDir(dirPath)
    .then(() => axios.get(targetURL))
    .then(response => cheerio.load(response.data))
    .then($ => downloadAllResources(targetURL, dirPath, $))
    .then($ => resourcesLinkstoLocal($, targetURL, dirName))
    .then(html => writeFile(pagePath, html))
    .then(() => console.log(`Page was downloaded as '${pageName}' to ${outputPath}`))
    .catch((err) => {
      console.error(getErrorMessage(err, targetURL));
      return Promise.reject(err);
    });
};
