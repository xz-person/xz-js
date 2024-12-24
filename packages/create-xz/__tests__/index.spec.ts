import { describe, expect, test, vi } from 'vitest';
import prompt from 'prompts';
import { init } from '../src/index';

describe('测试create-xz', () => {
    test('项目名称非空', async () => {
        let injected = [''];
        prompt.inject(injected);
        vi.spyOn(console, 'log');
        await init();
        expect(console.log).toHaveBeenCalledWith('项目名称不能为空');
    });
    test('项目名称格式', async () => {
        let injected = ['aa'];
        prompt.inject(injected);
        vi.spyOn(console, 'log');
        await init();
        expect(console.log).toHaveBeenCalledWith('项目名称必须 xz- 开头');
    });
    test('成功创建', async () => {
        let injected = ['xz-app', '项目简介', 'app'];
        prompt.inject(injected);
        vi.spyOn(console, 'log').mockImplementationOnce(() => '成功');
        await init();
        expect(console.log()).toContain('成功');
    });
});
