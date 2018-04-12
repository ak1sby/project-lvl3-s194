import fs from 'mz/fs';
import path from 'path';
import process from 'process';
import axios from 'axios';
import { getFileName, makeDir, normalizeURL, resourcesLinkstoLocal, getResourcesLinks, getPaths, makeTask } from './utils';

const tagsAttr = {
  img: ['src', 'data-original'],
  link: ['href'],
  script: ['src'],
};

const downloadFile = (fileURL, dirPath) => {
  const fileName = getFileName(fileURL);
  const filePath = path.resolve(dirPath, fileName);
  return axios.get(fileURL, { responseType: 'stream' })
    .then((response) => {
      response.data.pipe(fs.createWriteStream(filePath));
    })
    .then(() => true)
    .catch(() => false);
};

const downloadAllResources = (arrayOfURLs, pathForLoading, loadTask) => Promise.all(arrayOfURLs
  .map(currentURL => (loadTask ?
    makeTask(downloadFile, 'Loading', currentURL, pathForLoading) :
    downloadFile(currentURL, pathForLoading))));

export default (targetURL, outputPath = process.cwd(), loadTask = false) => {
  const { dirPath } = getPaths(targetURL, outputPath);
  return makeDir(dirPath)
    .then(() => getResourcesLinks(targetURL, tagsAttr))
    .then(data => resourcesLinkstoLocal(targetURL, outputPath, tagsAttr, data))
    .then(arrayOfLinks => arrayOfLinks.map(link => normalizeURL(link, targetURL)))
    .then(arrayOfURLs => downloadAllResources(arrayOfURLs, dirPath, loadTask));
};
