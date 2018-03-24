import fs from 'mz/fs';
import url from 'url';
import path from 'path';
import process from 'process';
import axios from 'axios';
import cheerio from 'cheerio';
import _ from 'lodash';
import createDebug from 'debug';
import Listr from 'listr';
import { urlToStr, getFileName, makeDir } from './utils';
import errorHandler from './errorHandler';


const debug = createDebug('page-loader:other');

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

const downloadFile = (link, filePath) => {
  const task = new Listr([
    {
      title: `Loading: ${link}`,
      task: () => axios.get(link, { responseType: 'stream' })
        .then((response) => {
          response.data.pipe(fs.createWriteStream(filePath));
        })
        .catch(err => Promise.reject(console.error(errorHandler(err, link)))),
    },
  ]);
  return task.run()
    .then(() => true)
    .catch(() => false);
};


const downloadSrc = (currentUrl, dirPath, links, html) => Promise.all(links.map((link) => {
  // const ext = getExtFromLink(link);
  const fileName = getFileName(link);
  const srcUrl = url.resolve(currentUrl, link);
  // const dirPathExt = path.resolve(dirPath, _.trim(ext, '.'));
  const filePath = path.resolve(dirPath, fileName);
  return downloadFile(srcUrl, filePath);
})).then((data) => {
  const downloadedFiles = data.filter(e => e);
  const percentOfsuccess = (downloadedFiles.length / data.length) * 100;
  console.log(`Downloaded : ${downloadedFiles.length} of ${data.length} (${percentOfsuccess} %)`);
  return html;
});


const changeTags = (html, dirName) => Object.keys(TagsAttr).reduce((acc, tag) => {
  const $ = cheerio.load(acc);
  $(tag).each((i, e) => {
    const oldSrc = $(e).attr(TagsAttr[tag]);
    if (oldSrc) {
      // const { ext } = path.parse(oldSrc);
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
  return axios.get(currentUrl)
    .then(response => getSrcLinks(response.data))
    .then(html => makeDir(dirPath, html))
    .then(({ srcLinks, html }) => downloadSrc(currentUrl, dirPath, srcLinks, html))
    .then(html => changeTags(html, dirName))
    .then(html => fs.writeFile(pagePath, html))
    .then(() => console.log(`Page was downloaded as '${pageName}' to ${outputPath}`))
    .catch(err => Promise.reject(err));
};
