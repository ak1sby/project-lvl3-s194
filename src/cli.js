import program from 'commander';

import loadPage from '.';

export default () => {
  program
    .version('0.0.13')
    .arguments('<url>')
    .description('Website Downloader')
    .usage('[options] <Directory> <URL>')
    .option('-o, --output [path]', 'output path')
    .action(url => loadPage(url, program.output))
    .parse(process.argv);
  if (!program.args.length) program.help();
};
