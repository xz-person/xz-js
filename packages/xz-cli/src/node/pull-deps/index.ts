import path from 'node:path';
import fs from 'node:fs';
import { green } from 'kolorist';
import { simpleGit, SimpleGitProgressEvent } from 'simple-git';
import cliProgress from 'cli-progress';
import { CWD, TEMP } from '../shared/constant';
import { DepConfig } from '../shared/loadDepsConfig';

const TEMP_PATH = path.resolve(CWD, '../', TEMP);
if (!fs.existsSync(TEMP_PATH)) {
    fs.mkdirSync(TEMP_PATH);
}
// 创建simpleGit实例
const git = simpleGit({ maxConcurrentProcesses: 5 });
// 进度条
const bar = new cliProgress.SingleBar(
    {
        clearOnComplete: false,
        hideCursor: true,
        format: ' {bar} {percentage}%  | {filename} | {value}/{total}',
    },
    cliProgress.Presets.shades_classic
);

export async function pull(depsConfig: DepConfig[]): Promise<boolean> {
    const tasks = depsConfig.map((item) => handleTask(item));
    console.log('\n开始处理远程依赖\n');
    bar.start(tasks.length, 0, { filename: '准备开始处理。。。' });
    await concurrentTasks(tasks, 1);
    bar.stop();
    console.log(green(`\n所有远程依赖处理完成 -> ${TEMP_PATH}`));
    return true;
}
function handleTask(item: DepConfig) {
    return async () => {
        const projectPath = path.resolve(TEMP_PATH, item.name);
        if (!fs.existsSync(projectPath)) {
            // console.log(`开始克隆 ${item.name}`);
            await git.clone(item.remote, projectPath);
            bar.increment({ filename: `处理${item.name}完成` });
            // console.log(green(`\n${item.name} 成功克隆到-> ${projectPath}`));
        } else {
            // console.log(`${item.name} 已存在，检查是否要更新`);
            await git.cwd(projectPath);
            await git.checkout(item.branch);
            // console.log(`${item.name} 切换到目标分支 ${item.branch}`);
            // console.log(`${item.name} 检查远程 ${item.branch} 分支状态`);
            await git.fetch();
            const { behind } = await git.status();
            if (behind) {
                // console.log(`${item.name} 有更新，开始更新`);
                await git.pull();
                // console.log(green(`\n${item.name} 更新完成`));
            } else {
                // console.log(green(`\n${item.name} 已是最新，无需更新 `));
            }
            bar.increment({ filename: `处理${item.name}完成` });
        }
    };
}

function concurrentTasks(tasks: (() => Promise<any>)[], concurrency: number) {
    return new Promise<void>((resolve, reject) => {
        if (tasks.length === 0) {
            resolve();
            return;
        }
        let completed = 0;
        let index = 0;
        function next() {
            const task = tasks[index];
            index++;
            task()
                .then(() => {
                    completed++;
                    if (index < tasks.length) {
                        next();
                    } else if (completed === tasks.length) {
                        resolve();
                    }
                })
                .catch((err) => {
                    reject(err);
                });
        }
        for (let i = 0; i < Math.min(concurrency, tasks.length); i++) {
            next();
        }
    });
}
