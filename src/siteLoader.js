import url from 'url';
import process from 'process';
import axios from 'axios';
import cheerio from 'cheerio';
import loadPage from './pageLoader';
import errorHandler from './errorHandler';

// const downloadedPages = new Set();

const getFiltredLinks = (links, currentUrl) => links.filter((link) => {
  const mainPageHost = url.parse(currentUrl).hostname;
  const linkHostName = url.parse(link).hostname;
  return mainPageHost === linkHostName || !linkHostName;
});

const normalizeLinks = (links, currentUrl) => links.map((link) => {
  const { protocol, hostname } = url.parse(currentUrl);
  const linkHostName = url.parse(link).hostname;
  return !linkHostName ? `${protocol}//${hostname}${link}` : link;
});

const getPageLinks = (html, currentUrl) => {
  const $ = cheerio.load(html);
  const pageLinks = $('a').map((i, e) => ($(e).attr('href'))).get();
  const filtredLinks = getFiltredLinks(pageLinks, currentUrl);
  return normalizeLinks(filtredLinks, currentUrl);
};

export default (currentUrl, outputPath = process.cwd(), page = 1) => {
  if (page === 1) {
    return loadPage(currentUrl, outputPath);
  }
  return axios.get(currentUrl)
    .then(response => getPageLinks(response.data, currentUrl))
    .then((links) => {
      links.map(link => loadPage(link, currentUrl));
    })
    .catch(err => errorHandler(err, currentUrl));
};
