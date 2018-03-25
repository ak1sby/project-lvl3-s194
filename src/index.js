import url from 'url';
import process from 'process';
import axios from 'axios';
import cheerio from 'cheerio';
import loadPage from './pageLoader';
import { normalizeURL } from './utils';

// const downloadedPages = new Set();

const getFiltredLinks = (links, templateURL) => links.filter((link) => {
  const templateHost = url.parse(templateURL).hostname;
  const linkHost = url.parse(link).hostname;
  return templateHost === linkHost || !linkHost;
});

const getPageLinks = (html, currentUrl) => {
  const $ = cheerio.load(html);
  const pageLinks = $('a').map((i, e) => ($(e).attr('href'))).get();
  const filtredLinks = getFiltredLinks(pageLinks, currentUrl);
  const normalizedURLs = filtredLinks.map(link => normalizeURL(link, currentUrl));
  return normalizedURLs;
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
