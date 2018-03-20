import nock from 'nock';
import httpAdapter from 'axios/lib/adapters/http';
import axios from 'axios';
import fs from 'mz/fs';
import os from 'os';
import path from 'path';
import loadPage from '../src';


const currentUrl = 'http://hexlet.io/courses';
const filename = 'hexlet-io-courses.html';
const expectedData = 'Hexlet courses';

beforeAll(() => {
  axios.defaults.adapter = httpAdapter;
  nock.disableNetConnect();
  nock('http://hexlet.io')
    .get('/courses')
    .reply(200, expectedData);
});

const makeTempDir = () => {
  const tmpDir = `${os.tmpdir()}${path.sep}`;
  return fs.mkdtemp(tmpDir)
    .catch(err => console.log(err.message));
};

describe('Test', () => {
  it('Load Hexlet courses page', async () => {
    const outputPath = await makeTempDir();
    const filepath = path.join(outputPath, filename);
    await loadPage(currentUrl, outputPath);

    const loadedData = await fs.readFile(filepath, 'utf-8');
    console.log(`loadedData contains: '${loadedData}'`);
    expect(loadedData).toEqual(expectedData);
  });
});
