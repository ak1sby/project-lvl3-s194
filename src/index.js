import fs from 'mz/fs';
import url from 'url';
import path from 'path';
import process from 'process';
import axios from 'axios';
import cheerio from 'cheerio';
import _ from 'lodash';
import createDebug from 'debug';

const debug = createDebug('page-loader:other');
const debugSaving = createDebug('page-loader:save');
const debugLoading = createDebug('page-loader:load');


const urlToStr = (currentUrl) => {
  const { hostname, pathname } = url.parse(currentUrl);
  const str = `${hostname}${pathname}`;
  const newStr = str.replace(/[^a-zA-Z0-9]+/gi, '-');
  return newStr[newStr.length - 1] === '-' ? newStr.slice(0, newStr.length - 1) : newStr;
};

const getFileName = (str) => {
  const { dir, name, ext } = path.parse(str);
  const newStr = `${urlToStr(dir)}-${name}`;
  return `${(newStr).replace(/[^a-zA-Z0-9]+/gi, '-')}${ext}`;
};

const TagsAttr = {
  img: 'src',
  link: 'href',
  script: 'src',
};

const getSrcLinks = (html) => {
  const $ = cheerio.load(html);
  const srcLinks = _.union(_.flatten(Object.keys(TagsAttr).map(tag => $(tag)
    .map((i, e) => ($(e).attr(TagsAttr[tag]))).get())));
  return { srcLinks, html };
};

const makeDir = (dirPath, dirName, outputPath, data) => {
  fs.exists(dirPath)
    .then((exists) => {
      if (!exists) {
        fs.mkdir(dirPath);
        debugSaving('Create folder %s', dirName);
        console.log(`Folder '${dirName}' for local resources was created in directory ${outputPath}\n`);
      } else console.log(`Used '${dirName}' folder for local resources in directory ${outputPath}\n`);
    });
  return data;
};

const downloadFile = (link, filePath) => axios.get(link, { responseType: 'stream' })
  .then((response) => {
    debugLoading('File was download: %s', link);
    response.data.pipe(fs.createWriteStream(filePath));
    debugSaving('File was save as: %s', path.basename(filePath));
    return { success: true, filePath };
  })
  .catch((error) => {
    debugLoading('Problem with download: %s', path.basename(link));
    debugSaving('Problem with save: %s', path.basename(filePath));
    return { success: false, error };
  });

const downloadSrc = (currentUrl, dirPath, links, html) => Promise.all(links.map((link) => {
  const fileName = getFileName(link);
  const srcUrl = url.resolve(currentUrl, link);
  const filePath = path.resolve(dirPath, fileName);
  return downloadFile(srcUrl, filePath);
})).then(() => html);


const changeTags = (html, dirName) => Object.keys(TagsAttr).reduce((acc, tag) => {
  const $ = cheerio.load(acc);
  $(tag).each((i, e) => {
    const oldSrc = $(e).attr(TagsAttr[tag]);
    if (oldSrc) {
      const fileName = getFileName(oldSrc);
      const newSrc = path.join(dirName, fileName);
      $(e).attr(TagsAttr[tag], newSrc);
    }
    debug('Change src for %s tags', tag);
  });
  return $.html();
}, html);

export default (currentUrl, outputPath = process.cwd()) => {
  const pageName = `${urlToStr(currentUrl)}.html`;
  const dirName = `${urlToStr(currentUrl)}_files`;
  const pagePath = path.join(outputPath, pageName);
  const dirPath = path.join(outputPath, dirName);
  makeDir(dirPath, dirName, outputPath);
  return axios.get(currentUrl)
    .then(response => getSrcLinks(response.data))
    .then(({ srcLinks, html }) => downloadSrc(currentUrl, dirPath, srcLinks, html))
    .then(html => changeTags(html, dirPath))
    .then((html) => {
      fs.writeFile(pagePath, html);
      debugSaving('Page was saved as %s', pageName);
      console.log(`Page was downloaded as '${pageName}' to ${outputPath}`);
    })
    .catch(err => console.log(err.message));
};
