import url from 'url';
import process from 'process';
import axios from 'axios';
import cheerio from 'cheerio';
import loadPage from './pageLoader';
import { normalizeURL } from './utils';

// const downloadedPages = new Set();

const getFiltredLinks = (links, currentUrl) => links.filter((link) => {
  const mainPageHost = url.parse(currentUrl).hostname;
  const linkHostName = url.parse(link).hostname;
  return mainPageHost === linkHostName || !linkHostName;
});

const getPageLinks = (html, currentUrl) => {
  const $ = cheerio.load(html);
  const pageLinks = $('a').map((i, e) => ($(e).attr('href'))).get();
  const filtredLinks = getFiltredLinks(pageLinks, currentUrl);
  return normalizeURL(filtredLinks, currentUrl);
};

export default (targetURL, outputPath = process.cwd(), page = 1) => {
  if (page === 1) {
    return loadPage(targetURL, outputPath);
  }
  return axios.get(targetURL)
    .then(response => getPageLinks(response.data, targetURL))
    .then((links) => {
      links.map(link => loadPage(link, outputPath));
    });
};