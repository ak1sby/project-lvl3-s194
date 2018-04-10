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
    .option('-d, --depth [depth]', 'depth of loading')
    .action((url) => {
      loadSite(url, program.output, program.depth)
        .catch(() => process.exit(1));
    })
    .parse(process.argv);
  if (!program.args.length) program.help();
};
