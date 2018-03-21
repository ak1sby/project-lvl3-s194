import nock from 'nock';
import httpAdapter from 'axios/lib/adapters/http';
import axios from 'axios';
import fs from 'mz/fs';
import createDebug from 'debug';
import os from 'os';
import path from 'path';
import loadPage from '../src';

const debug = createDebug('page-loader:other');
const debugSaving = createDebug('page-loader:save');
const debugLoading = createDebug('page-loader:load');

const currentUrl = 'http://hexlet.io/courses';
const filename = 'hexlet-io-courses.html';
const sourceData = `${__dirname}/__fixtures__/page.html`;
const pathFile1 = `${__dirname}/__fixtures__/assets/cdn2-hexlet-io-assets-application-b7be9f361552c63ed71e93ffc3e59a01703825afea41ff93b20f9988bfb5c9fb.css`;
const pathFile2 = `${__dirname}/__fixtures__/attachments/cdn2-hexlet-io-attachments-5d3878838d8e1b6f5f19f70b52cb13e7827870f5-store-ba086f1940c3ca7e227a38f1d7f2d93d945102036b9692c15a9cf9c222fd-image.png`;

beforeAll(() => {
  axios.defaults.adapter = httpAdapter;
  nock.disableNetConnect();
  nock('http://hexlet.io')
    .get('/courses')
    .replyWithFile(200, sourceData);

  nock('https://cdn2.hexlet.io')
    .get('/attachments/5d3878838d8e1b6f5f19f70b52cb13e7827870f5/store/ba086f1940c3ca7e227a38f1d7f2d93d945102036b9692c15a9cf9c222fd/image.png')
    .replyWithFile(200, pathFile1)
    .get('/assets/application-b7be9f361552c63ed71e93ffc3e59a01703825afea41ff93b20f9988bfb5c9fb.css')
    .replyWithFile(200, pathFile2);
});

const makeTempDir = () => {
  const tmpDir = `${os.tmpdir()}${path.sep}`;
  return fs.mkdtemp(tmpDir);
};

describe('Test', () => {
  it('Rename tags src to local', async () => {
    const outputPath = await makeTempDir();
    debugSaving('Create temp folder %s', outputPath);
    const filepath = path.join(outputPath, filename);
    await loadPage(currentUrl, outputPath);
    debugLoading('PAGE WAS CREATED: %s', outputPath);
    const loadedData = await fs.readFile(filepath, 'utf-8');
    debug('FILE WAS READED %s tags', loadedData);
    const expectedData = `<!DOCTYPE html><html lang="en"><head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <link rel="stylesheet" media="all" href="${outputPath}/hexlet-io-courses_files/cdn2-hexlet-io-assets-application-b7be9f361552c63ed71e93ffc3e59a01703825afea41ff93b20f9988bfb5c9fb.css">
  <title>Hexlet.io</title>
</head>
<body>
  <img src="${outputPath}/hexlet-io-courses_files/cdn2-hexlet-io-attachments-5d3878838d8e1b6f5f19f70b52cb13e7827870f5-store-ba086f1940c3ca7e227a38f1d7f2d93d945102036b9692c15a9cf9c222fd-image.png">
</body></html>`;
    expect(loadedData).toEqual(expectedData);
  });
});
