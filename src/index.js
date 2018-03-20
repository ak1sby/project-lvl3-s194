import fs from 'mz/fs';
import url from 'url';
import path from 'path';
import process from 'process';
import axios from 'axios';


const getFileName = (currentUrl) => {
  const { hostname, pathname } = url.parse(currentUrl);
  return `${(hostname + pathname).replace(/[^a-zA-Z0-9]+/gi, '-')}.html`;
};

export default (currentUrl, outputPath = process.cwd()) => {
  const fileName = getFileName(currentUrl);
  const filePath = path.join(outputPath, fileName);
  const result = axios.get(currentUrl)
    .then((response) => {
      if (response.status !== 200) {
        throw new Error(`Expected 200, but was ${response.status} for '${currentUrl}'`);
      }
      return response.data;
    })
    .then(data => fs.writeFile(filePath, data))
    .then(() => console.log(`Page was downloaded as '${fileName}' to ${outputPath}`))
    .catch(err => console.log(err.message));

  return result;
};
