import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
    entries: ['src/node/cli', 'src/client/index'],
    clean: true,
    declaration: true,
    rollup: {
        inlineDependencies: true,
    },
});
