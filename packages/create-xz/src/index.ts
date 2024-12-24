import fs from 'node:fs';
import path from 'node:path';
import { copy, getDirname, emptyDir } from './utils';
import minimist from 'minimist';
import { green, red, reset, gray } from 'kolorist';
import prompts from 'prompts';

// 获取当前模块所在的目录路径
const __dirname = getDirname(import.meta.url);
// 获取当前工作目录路径
const cwd = process.cwd();
//获取命令行参数
const argv = minimist(process.argv.slice(2));
const defaultTargetDir = 'xz-app';
export async function init() {
    const argTemplate = argv.template || argv.t;
    const { projectName, projectDescription, projectTemplate } = await prompts(
        [
            {
                type: 'text',
                name: 'projectName',
                message: reset('项目名称'),
                initial: defaultTargetDir,
                validate: validProjectName,
            },
            {
                type: 'text',
                name: 'projectDescription',
                message: reset('项目简介'),
                initial: defaultTargetDir,
            },
            {
                type: argTemplate ? null : 'select',
                name: 'projectTemplate',
                instructions: false,
                message: reset('项目模板'),
                choices: [
                    { title: '应用', value: 'app' },
                    { title: '基础应用', value: 'bf' },
                ],
            },
        ],
        {
            onCancel: () => {
                throw new Error(red('✖') + ' ' + reset('操作取消'));
            },
        }
    );
    //验证项目名称
    if (validProjectName(projectName) !== true) {
        console.log(red(validProjectName(projectName) as string));
        return;
    }

    const projectDir = path.resolve(cwd, projectName);
    const template = argTemplate || projectTemplate;
    const templateDir = path.resolve(__dirname, `../template-${template}`);
    //检查目标目录是否存在，如果存在则询问是否覆盖
    if (fs.existsSync(projectDir)) {
        const { overwrite } = await prompts(
            {
                type: 'confirm',
                name: 'overwrite',
                message: () =>
                    `${red('✖')} ${reset(
                        `目标目录 ${projectName} 已经存在，是否覆盖？`
                    )} `,
            },
            {
                onCancel: () => {
                    throw new Error(red('✖') + '' + reset('操作取消'));
                },
            }
        );
        if (!overwrite) {
            return;
        } else {
            emptyDir(projectDir);
        }
    } else {
        fs.mkdirSync(projectDir, { recursive: true });
    }
    //复制模板项目到目标目录
    const templateFiles = fs.readdirSync(templateDir);
    for (const file of templateFiles.filter((f) => f !== 'package.json')) {
        copy(path.resolve(templateDir, file), path.resolve(projectDir, file));
    }

    //#region package.json文件处理
    //读取 package.json 文件
    const pkgInfo = JSON.parse(
        fs.readFileSync(path.join(templateDir, 'package.json'), 'utf-8')
    );
    //修改 package.json 文件的 name 和 description
    pkgInfo.name = projectName;
    pkgInfo.description = projectDescription;
    //写入修改后的 package.json 文件
    fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify(pkgInfo, null, 2)
    );
    //#endregion

    //#region处理src目录下的文件
    const srcDirPath = path.resolve(projectDir, 'src');

    //src目录下xz-app目录重命名为项目名称
    const srcProjectDirPath = path.resolve(srcDirPath, defaultTargetDir);
    const renameProjectDirPath = path.resolve(srcDirPath, projectName);
    if (template !== 'bf') {
        fs.renameSync(srcProjectDirPath, renameProjectDirPath);
    }

    //shared目录路由文件处理
    const sharedRoutePath = path.resolve(srcDirPath, 'shared/route-map.ts');
    replaceProjectNameInFile(sharedRoutePath, /xz-app/g, projectName);

    //pages目录下index.ts文件处理(布局组件)
    const layoutPath = path.resolve(renameProjectDirPath, 'pages/index.tsx');
    replaceProjectNameInFile(layoutPath, /xz-app/g, projectName);
    //#endregion

    console.log(`\n${green('√ 初始化完成')}`);
    const pkg = pkgFromUserAgent(process.env.npm_config_user_agent);
    const pkgManager = pkg ? pkg.name : 'npm';
    const cdProjectName = path.relative(cwd, projectDir);

    console.log(`${reset('\n 按以下的命令来运行项目：')}`);
    if (cwd !== projectDir) {
        console.log(`${reset(`  cd ${cdProjectName}`)}`);
        if (template !== 'bf') {
            console.log(`${reset(`  npx xz install`)} ${gray('安装依赖项目')}`);
        }
    }
    switch (pkgManager) {
        case 'yarn':
            console.log(`  ${reset(`${pkgManager}`)}`);
            console.log(`  ${reset(`${pkgManager} dev`)}`);
            break;
        default:
            console.log(`  ${reset(`${pkgManager} install`)}`);
            console.log(`  ${reset(`${pkgManager} run dev`)}`);
            break;
    }
}

function replaceProjectNameInFile(
    filePath: string,
    regex: RegExp,
    replace: string
) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const updatedContent = fileContent.replace(regex, replace);
    fs.writeFileSync(filePath, updatedContent);
}

function pkgFromUserAgent(userAgent: string | undefined) {
    if (!userAgent) return undefined;
    const pkgSpec = userAgent.split(' ')[0];
    const pkgSpecArr = pkgSpec.split('/');
    return {
        name: pkgSpecArr[0],
        version: pkgSpecArr[1],
    };
}
function validProjectName(projectName: string) {
    const trimmed = projectName.trim();
    if (!trimmed) {
        return '项目名称不能为空';
    }
    if (!trimmed.startsWith('xz-')) {
        return '项目名称必须 xz- 开头';
    }
    return true;
}

init().catch((err) => {
    console.log(err);
});
