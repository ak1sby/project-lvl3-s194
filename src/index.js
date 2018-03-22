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
  return _.trim(newStr, '-');
};

const getFileName = (link) => {
  const { dir, name } = path.parse(link);
  const { pathname } = url.parse(link);
  const { ext } = path.parse(pathname);
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

const makeDir = (dirPath, response) => fs.mkdir(dirPath)
  .then(() => {
    debugSaving('Folder was create %s', dirPath);
    return response;
  });

const downloadFile = (link, filePath) => axios.get(link, { responseType: 'stream' })
  .then((response) => {
    response.data.pipe(fs.createWriteStream(filePath));
  })
  .then(() => {
    debugLoading('File was download: %s', link);
    return { success: true, filePath };
  })
  .catch((error) => {
    debugLoading('Can`t download: %s', link);
    return { success: false, error };
  });

const downloadSrc = (currentUrl, dirPath, links, html) => Promise.all(links.map((link) => {
  const { ext } = path.parse(link);
  const fileName = getFileName(link);
  const srcUrl = url.resolve(currentUrl, link);
  const dirPathExt = path.resolve(dirPath, _.trim(ext, '.'));
  const filePath = path.resolve(dirPathExt, fileName);
  return fs.mkdir(dirPathExt)
    .then(() => downloadFile(srcUrl, filePath))
    .catch(() => downloadFile(srcUrl, filePath));
})).then((data) => {
  const downloadFiles = data.filter(e => e.success);
  const procentDownloadFilses = (downloadFiles.length / data.length) * 100;
  console.log(`Was downloaded : ${downloadFiles.length} of ${data.length} (${procentDownloadFilses} %)`);
  return html;
});

const changeTags = (html, dirName) => Object.keys(TagsAttr).reduce((acc, tag) => {
  const $ = cheerio.load(acc);
  $(tag).each((i, e) => {
    const oldSrc = $(e).attr(TagsAttr[tag]);
    if (oldSrc) {
      const { ext } = path.parse(oldSrc);
      const fileName = getFileName(oldSrc);
      const newSrc = path.join(dirName, _.trim(ext, '.'), fileName);
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
  return fs.exists(outputPath)
    .then(() => axios.get(currentUrl))
    .then(response => getSrcLinks(response.data))
    .then(response => makeDir(dirPath, response))
    .then(({ srcLinks, html }) => downloadSrc(currentUrl, dirPath, srcLinks, html))
    .then(html => changeTags(html, dirName))
    .then((html) => {
      fs.writeFile(pagePath, html)
        .then(() => console.log(`Page was downloaded as '${pageName}' to ${outputPath}`));
    })
    .catch(err => console.error(err));
};
