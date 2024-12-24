import fs from 'node:fs';
import path from 'node:path';
import { green } from 'kolorist';
import { mergePackageJsons, PackageJson } from './mergePackageJson';
import { CWD, TEMP, DEPS } from '../shared/constant';
import { DepConfig } from '../shared/loadDepsConfig';
// 项目前缀
const PROJECT_PREFIX = 'xz-';
// 共享目录
const PROJECT_SHARED = 'shared';
// 源项目的依赖放置目录
const sourceDirPath = path.resolve(CWD, '../', TEMP);
// 目标项目的依赖放置目录
const targetDirPath = path.resolve(CWD, DEPS);
// 项目名称不带前缀
let projectNameWithoutPrefix = '';

//遍历所有的依赖项目;
export function build(depsConfig: DepConfig[]) {
    console.log('开始处理依赖项目');
    // 检查目标目录,没有时创建，有时清空
    if (!fs.existsSync(targetDirPath)) {
        fs.mkdirSync(targetDirPath, { recursive: true });
    } else {
        emptyDir(targetDirPath);
    }
    // 读取依赖项目的配置文件
    const basePackageJson = getPackageJson(path.resolve(CWD, 'package.json'));
    const depsPackageJson: PackageJson[] = [];
    //遍历所有依赖项目
    depsConfig.forEach((item) => {
        const { name } = item;
        //读取依赖项目的目录
        const sourceDirRootPath = path.resolve(sourceDirPath, name);
        projectNameWithoutPrefix = name.split('-').at(-1)!;
        // 遍历依赖项目的目录
        if (isDirectory(sourceDirRootPath)) {
            // 处理依赖项目的src目录到目标目录
            handleSrcToDeps(sourceDirRootPath);
            //收集package.json
            collectPackageJson(sourceDirRootPath, depsPackageJson);
        }
    });
    //处理package.json
    hanldePackageJson(basePackageJson, depsPackageJson);
    console.log(green(`所有依赖处理成功`));
}

function handleSrcToDeps(sourceDirRootPath: string) {
    // 依赖项目的src目录
    const sourceSrcDirPath = path.resolve(sourceDirRootPath, 'src');
    //依赖项目的src目录下的所有文件和目录
    const sourceSrcFiles = fs.readdirSync(sourceSrcDirPath);
    //遍历依赖项目的src目录下的所有文件和目录
    for (let sourceSrcFile of sourceSrcFiles) {
        //处理依赖项目的src目录下xz-开头的目录到目标目录
        if (sourceSrcFile.startsWith(PROJECT_PREFIX)) {
            handleAliasPath(
                path.resolve(sourceSrcDirPath, sourceSrcFile),
                path.resolve(targetDirPath, sourceSrcFile)
            );
        }
        //处理shared目录下的文件到目标目录
        else if (sourceSrcFile.startsWith(PROJECT_SHARED)) {
            handleSharedToDeps(sourceSrcDirPath, projectNameWithoutPrefix);
        } else {
            handleAliasPath(
                path.resolve(sourceSrcDirPath, sourceSrcFile),
                path.resolve(targetDirPath, sourceSrcFile)
            );
        }
    }
}

function handleAliasPath(srcPath: string, destPath: string) {
    if (isDirectory(srcPath)) {
        for (let srcFile of fs.readdirSync(srcPath)) {
            const srcFilePath = path.resolve(srcPath, srcFile);
            const destFilePath = path.resolve(destPath, srcFile);
            if (isDirectory(srcFilePath)) {
                handleAliasPath(srcFilePath, destFilePath);
            } else {
                overWriteAliasPath(srcFilePath, destFilePath);
            }
        }
    } else {
        overWriteAliasPath(srcPath, destPath);
    }
}
function overWriteAliasPath(srcPath: string, destPath: string) {
    const data = fs.readFileSync(srcPath, 'utf-8');
    if (!fs.existsSync(path.dirname(destPath))) {
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
    }
    fs.writeFileSync(destPath, data.replace(/@src\//g, `@deps/`));
}
function handleSharedToDeps(
    sourceSrcDirPath: string,
    projectNameWithoutPrefix: string
) {
    // shared目录下的所有文件和目录
    const sharedDirPath = path.resolve(sourceSrcDirPath, PROJECT_SHARED);
    const sharedFiles = fs.readdirSync(sharedDirPath);
    // 遍历shared目录下的所有文件和目录
    for (let sharedFile of sharedFiles) {
        //文件名
        const sharedFileName = sharedFile.split('.').at(-2)!;
        //文件后缀
        const sharedFileSuffix = sharedFile.split('.').at(-1);
        //生成一个以文件名为名称的目录
        const destSharedFileDirPath = path.resolve(
            targetDirPath,
            PROJECT_SHARED,
            sharedFileName
        );
        //生成一个以文件名-项目名的形式的文件名
        const destSharedFileName = `${sharedFileName}-${projectNameWithoutPrefix}.${sharedFileSuffix}`;
        const destSharedFilePath = path.resolve(
            destSharedFileDirPath,
            destSharedFileName
        );
        //将文件放入文件夹,并处理路径
        overWriteAliasPath(
            path.resolve(sharedDirPath, sharedFile),
            destSharedFilePath
        );
        // 在以文件名为名称的目录中生成一个index.ts文件，文件内容为export * from './文件名-项目名';
        const destSharedFileIndexPath = path.resolve(
            destSharedFileDirPath,
            'index.ts'
        );
        if (!fs.existsSync(destSharedFileIndexPath)) {
            fs.writeFileSync(
                destSharedFileIndexPath,
                `export * from './${destSharedFileName}';\n`
            );
        } else {
            fs.appendFileSync(
                destSharedFileIndexPath,
                `export * from './${destSharedFileName}';\n`
            );
        }
    }
}

function collectPackageJson(
    sourceDirRootPath: string,
    depsPackageJson: PackageJson[]
) {
    const packageJson = getPackageJson(
        path.resolve(sourceDirRootPath, 'package.json')
    );
    //收集package.json
    depsPackageJson.push(packageJson);
}
function getPackageJson(path: string) {
    const pkgContent = fs.readFileSync(path, 'utf-8');
    return JSON.parse(pkgContent);
}

function hanldePackageJson(
    basePackageJson: PackageJson,
    depsPackageJson: PackageJson[]
) {
    // 合并package.json
    const newPackageJson = mergePackageJsons(basePackageJson, depsPackageJson);
    // 写入package.json
    fs.writeFileSync(
        path.resolve(CWD, 'package.json'),
        JSON.stringify(newPackageJson, null, 4)
    );
}

function isDirectory(dir: string) {
    const stat = fs.statSync(dir);
    return stat.isDirectory();
}

/**
 * 复制文件或目录
 */
export function copy(src: string, dest: string) {
    // 如果源是一个目录
    if (isDirectory(src)) {
        copyDir(src, dest);
    }
    // 如果源是一个文件
    else {
        // 使用 fs.copyFileSync 方法复制文件
        fs.copyFileSync(src, dest);
    }
}

/**
 * 复制目录及其内容到目标目录
 */
export function copyDir(srcDir: string, destDir: string) {
    // 使用 fs.mkdirSync 方法创建目标目录 destDir，{ recursive: true } 表示如果目标目录的父目录不存在，也会被创建
    fs.mkdirSync(destDir, { recursive: true });
    // 使用 fs.readdirSync 方法读取源目录 srcDir 中的所有文件和目录
    for (const file of fs.readdirSync(srcDir)) {
        // 使用 path.resolve 方法将源目录 srcDir 和当前遍历的文件或目录 file 拼接成绝对路径 srcFile
        const srcFile = path.resolve(srcDir, file);
        // 使用 path.resolve 方法将目标目录 destDir 和当前遍历的文件或目录 file 拼接成绝对路径 destFile
        const destFile = path.resolve(destDir, file);
        // 调用 copy 函数，将 srcFile 复制到 destFile
        copy(srcFile, destFile);
    }
}

export function emptyDir(dir: string) {
    // 检查目录是否存在，如果不存在则直接返回
    if (!fs.existsSync(dir)) {
        return;
    }
    // 读取目录中的所有文件和目录
    for (const file of fs.readdirSync(dir)) {
        // 如果是.git 目录，则跳过不处理
        if (file === '.git') {
            continue;
        }
        // 使用 path.resolve 方法将目录和文件名拼接成绝对路径
        const filePath = path.resolve(dir, file);
        fs.rmSync(filePath, { recursive: true, force: true });
    }
}
