import process from 'process';
import url from 'url';
import createDebug from 'debug';
import loadPage from './pageLoader';
import { normalizeURL, getResourcesLinks, makeTask, getPercentOfsuccess } from './utils';
import getErrorMessage from './errors';

const debug = createDebug('page-loader:other');

const getSameHostURLs = (links, templateURL) => links.filter((link) => {
  const templateHost = url.parse(templateURL).hostname;
  const linkHost = url.parse(link).hostname;
  return templateHost === linkHost || !linkHost;
});

const iter = (acc, array, callback, innerFn = () => {}) => {
  if (array.length < 1) {
    debug('Array is empty\n');
    return acc;
  }
  const [head, ...rest] = array;
  return callback(head)
    .then((data) => {
      if (data) {
        return innerFn(head, data);
      }
      return innerFn(head);
    })
    .then((data) => {
      if (data) {
        return iter([...acc, ...data], rest, callback, innerFn);
      }
      return iter(acc, rest, callback, innerFn);
    })
    .catch((err) => {
      console.error(getErrorMessage(err, head));
      return iter(acc, rest, callback, innerFn);
    });
};

const getAllURLsFromPages = (array, depth) => {
  if (depth < 1) {
    return new Promise(resolve => resolve(array));
  }
  return iter(
    [],
    array,
    targetURL => makeTask(getResourcesLinks, 'Getting links from', targetURL, { a: ['href'] }),
    (targetURL, { resourcesLinks }) => {
      const normalizedArrayOfLink = resourcesLinks.map(link => normalizeURL(link, targetURL));
      const filtredLinks = getSameHostURLs(normalizedArrayOfLink, targetURL);
      return filtredLinks;
    },
  )
    .then(data => getAllURLsFromPages(new Set(data), depth - 1));
};

const getSite = (targetURL, outputPath = process.cwd(), depth = 0) => {
  const loadTask = depth === '0';
  return getAllURLsFromPages([targetURL], depth, [targetURL])
    .then(filtredLinks => iter(
      [],
      filtredLinks,
      (link) => {
        const result = loadTask ? loadPage(link, outputPath, loadTask) :
          makeTask(loadPage, 'Loading', link, outputPath, loadTask);
        return result.then((data) => {
          if (data) {
            getPercentOfsuccess(data);
          }
        });
      }
      ,
    ))
    .catch((err) => {
      console.error(getErrorMessage(err, targetURL));
      return Promise.reject(err);
    });
};

export default getSite;
