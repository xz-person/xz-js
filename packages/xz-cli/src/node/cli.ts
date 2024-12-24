import cac from 'cac';
import { pull } from './pull-deps';
import { build } from './build-deps';
import { loadDepsConfig } from './shared/loadDepsConfig';

import { name, version } from '../../package.json';
const cli = cac(name);

cli.command('install', '加载依赖项目')
    .alias('i')
    .action(async () => {
        const depsConfig = await loadDepsConfig();
        console.log(depsConfig);
        const pullSuccess = await pull(depsConfig);
        if (pullSuccess) {
            build(depsConfig);
        }
    });

cli.version(version);
cli.help();

cli.parse();
