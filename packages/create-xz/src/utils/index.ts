import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 获取当前模块所在的目录路径
 */
export function getDirname(importMetaUrl: ImportMeta['url']): string {
    // 使用 node:url 模块的 fileURLToPath 方法将 import.meta.url 转换为文件路径
    // 使用 node:path 模块的 dirname 方法获取文件路径的目录部分
    return path.dirname(fileURLToPath(importMetaUrl));
}

/**
 * 复制文件或目录
 */
export function copy(src: string, dest: string) {
    // 使用 fs.statSync 方法获取源文件或目录的状态
    const stat = fs.statSync(src);
    // 如果源是一个目录
    if (stat.isDirectory()) {
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
/**
 * 清空指定目录，删除其中的所有文件和子目录，但不包括.git 目录
 */
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
