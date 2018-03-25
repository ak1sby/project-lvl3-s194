import program from 'commander';
import { version } from '../package.json';
import loadSite from '.';

export default () => {
  program
    .version(version)
    .arguments('<url>')
    .description('Website Downloader')
    .usage('[options] <Directory> <URL>')
    .option('-o, --output [path]', 'output path')
    .action((url) => {
      loadSite(url, program.output)
        .catch(() => process.exit(1));
    })
    .parse(process.argv);
  if (!program.args.length) program.help();
};
