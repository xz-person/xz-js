import { Plugin, ResolvedConfig } from 'vite';
import path from 'node:path';
import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
const cwd = process.cwd();
const { name } = getPkgInfo();
const projectNameWithPrefix = name.split('-').at(-1);
let viteConfig: ResolvedConfig;

export default function vitePluginXZ(): Plugin {
    return {
        name: 'vite-plugin-xz',
        config: () => ({
            resolve: {
                alias: {
                    '@src': path.resolve(cwd, 'src'),
                    '@deps': path.resolve(cwd, 'deps'),
                },
            },
            build: {
                rollupOptions: {
                    output: {
                        manualChunks(id) {
                            if (id.includes('node_modules')) {
                                return 'vendor';
                            }
                            const projectNameRegex = /deps\/(\w+(-\w+)+)\//;
                            const projectNameMatch = id.match(projectNameRegex);
                            if (projectNameMatch) {
                                return projectNameMatch[1];
                            }
                        },
                        chunkFileNames: 'assets/js/[name]-[hash].js',
                        entryFileNames: 'assets/js/[name]-[hash].js',
                        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
                    },
                },
            },
        }),
        configResolved(config) {
            viteConfig = config;
        },
        buildStart() {
            mergeSharedFileToDeps();
        },
        async handleHotUpdate(ctx) {
            const { file, modules, read } = ctx;
            const sourceDirPath = path.resolve(viteConfig.root, 'src');
            const targetDirPath = path.resolve(viteConfig.root, 'deps');
            const osFile = path.resolve(file);
            const sharedDirPath = path.resolve(sourceDirPath, 'shared');

            if (osFile.startsWith(sourceDirPath)) {
                const relativePath = path.relative(
                    path.resolve(viteConfig.root, 'src'),
                    file
                );
                const depFilePath = path.join(targetDirPath, relativePath);
                if (osFile.startsWith(sharedDirPath)) {
                    const sharedFileName = path.parse(depFilePath).name;
                    const sharedFileDir = path.resolve(
                        path.dirname(depFilePath),
                        sharedFileName
                    );
                    if (!fs.existsSync(sharedFileDir)) {
                        await fsPromises.mkdir(sharedFileDir);
                    }
                    const sharedFilePath = path.resolve(
                        sharedFileDir,
                        `${sharedFileName}-${projectNameWithPrefix}.ts`
                    );
                    const sharedFileDirIndexPath = path.resolve(
                        sharedFileDir,
                        'index.ts'
                    );

                    const srcContent = await read();
                    await fsPromises.writeFile(sharedFilePath, srcContent);
                    const appendContent = `\nexport * from './${sharedFileName}-${projectNameWithPrefix}';`;
                    appendIndexFile(sharedFileDirIndexPath, appendContent);
                    return [];
                } else if (fs.existsSync(depFilePath)) {
                    try {
                        const content = await read();
                        await fsPromises.writeFile(depFilePath, content);
                        return [];
                    } catch (error) {
                        console.error(
                            `热更新时文件覆盖错误: ${depFilePath}`,
                            error
                        );
                    }
                }
            }
            return modules;
        },
    };
}

function mergeSharedFileToDeps() {
    const sourceDirPath = path.resolve(viteConfig.root, 'src/shared');
    const targetDirPath = path.resolve(viteConfig.root, 'deps/shared');
    fs.readdirSync(sourceDirPath).forEach((file) => {
        const fileName = path.parse(file).name;
        const sourceSharedFilePath = path.join(sourceDirPath, file);
        const targetSharedFileDirPath = path.join(targetDirPath, fileName);
        if (!fs.existsSync(targetSharedFileDirPath)) {
            fs.mkdirSync(targetSharedFileDirPath, { recursive: true });
        }
        const targetSharedFilePath = path.join(
            targetSharedFileDirPath,
            `${fileName}-${projectNameWithPrefix}.ts`
        );
        fs.writeFileSync(
            targetSharedFilePath,
            fs.readFileSync(sourceSharedFilePath, 'utf8')
        );
        const targetSharedFileDirIndexPath = path.join(
            targetSharedFileDirPath,
            'index.ts'
        );
        const appendContent = `\nexport * from './${fileName}-${projectNameWithPrefix}';`;
        appendIndexFile(targetSharedFileDirIndexPath, appendContent);
    });
}

function getPkgInfo() {
    const pkgPath = path.resolve(process.cwd(), 'package.json');
    const pkgInfo = fs.readFileSync(pkgPath, 'utf8');
    return JSON.parse(pkgInfo);
}

function appendIndexFile(filePath: string, content: string) {
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        if (data.includes(content)) {
            return;
        }
        fs.appendFileSync(filePath, content);
    } else {
        fs.appendFileSync(filePath, content);
    }
}
