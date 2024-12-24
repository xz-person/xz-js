import fs from 'node:fs';
import path from 'node:path';
import { DepConfig } from '../../client/index';
import { CWD, CONFIG_FILE } from './constant';
import { fileURLToPath } from 'node:url';
export type { DepConfig } from '../../client/index';
const configFilePath = path.resolve(CWD, CONFIG_FILE);
const __dirname = getDirname(import.meta.url);
export async function loadDepsConfig(): Promise<DepConfig[]> {
    return await buildDepsConfigFile();
}

async function buildDepsConfigFile(): Promise<DepConfig[]> {
    if (!fs.existsSync(configFilePath)) {
        throw new Error(`配置文件 ${CONFIG_FILE}  未找到`);
    }
    const configFileContent = fs.readFileSync(configFilePath, 'utf-8');
    configFileContent.replace('xz', '../../client/index');
    const tempConfigFilePath = path.resolve(__dirname, CONFIG_FILE);
    fs.writeFileSync(
        tempConfigFilePath,
        configFileContent.replace('xz', '../../client/index')
    );
    const config: DepConfig[] = await import(tempConfigFilePath);
    fs.rmSync(tempConfigFilePath);
    return config;
}

function getDirname(importMetaUrl: ImportMeta['url']): string {
    // 使用 node:url 模块的 fileURLToPath 方法将 import.meta.url 转换为文件路径
    // 使用 node:path 模块的 dirname 方法获取文件路径的目录部分
    return path.dirname(fileURLToPath(importMetaUrl));
}
