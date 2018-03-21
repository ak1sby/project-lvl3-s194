import program from 'commander';
import loadPage from '.';
import { version } from '../package.json';

export default () => {
  program
    .version(version)
    .arguments('<url>')
    .description('Website Downloader')
    .usage('[options] <Directory> <URL>')
    .option('-o, --output [path]', 'output path')
    .action(url => loadPage(url, program.output))
    .parse(process.argv);
  if (!program.args.length) program.help();
};
