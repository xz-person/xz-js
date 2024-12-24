import { test, expect, describe } from 'vitest';
import {
    mergePackageJsons,
    mergeDependencies,
    PackageJson,
} from '../src/utils/mergePackageJson';

describe('测试mergeDependencies', () => {
    test('没有相同Dependencie', () => {
        const dependencies1 = {
            dep1: '1.0.0',
            dep2: '1.0.0',
        };
        const dependencies2 = {
            dep3: '1.0.0',
        };

        const mergedDependencies = mergeDependencies(
            dependencies1,
            dependencies2
        );

        expect(mergedDependencies).toEqual({
            dep1: '1.0.0',
            dep2: '1.0.0',
            dep3: '1.0.0',
        });
    });

    test('有相同Dependencie时，处理版本冲突，采用高版本', () => {
        const dependencies1 = {
            dep1: '^1.0.0',
            dep2: '1.0.1',
        };
        const dependencies2 = {
            dep1: '1.0.1',
            dep2: '1.0.0',
            dep3: '1.0.0',
        };

        const mergedDependencies = mergeDependencies(
            dependencies1,
            dependencies2
        );
        expect(mergedDependencies).toEqual({
            dep1: '1.0.1',
            dep2: '1.0.1',
            dep3: '1.0.0',
        });
        //交换参数顺序
        const mergedDependencies1 = mergeDependencies(
            dependencies2,
            dependencies1
        );
        expect(mergedDependencies1).toEqual({
            dep1: '1.0.1',
            dep2: '1.0.1',
            dep3: '1.0.0',
        });
    });
});

describe('测试mergePackageJson', () => {
    test('others为空时，直接返回base', () => {
        const basePackageJson = {
            name: 'test',
            version: '1.0.0',
            dependencies: {
                dep1: '1.0.0',
            },
            devDependencies: {
                dep2: '1.0.0',
            },
        };
        const merged = mergePackageJsons(basePackageJson, []);
        expect(merged).toEqual(basePackageJson);
    });
    test('others不为空时，合并dependencies和devDependencies', () => {
        const basePackageJson = {
            name: 'test',
            version: '1.0.0',
            dependencies: {
                dep1: '1.0.0',
            },
            devDependencies: {
                dev1: '1.0.0',
            },
        };
        const others: PackageJson[] = [
            {
                dependencies: {
                    dep1: '1.0.0',
                    dep2: '1.0.0',
                },
                devDependencies: {
                    dev1: '1.0.0',
                    dev2: '1.0.0',
                },
            },
            {
                dependencies: {
                    dep3: '1.1.1',
                },
                devDependencies: {
                    dev3: '1.3.4',
                },
            },
        ];
        const merged = mergePackageJsons(basePackageJson, others);
        expect(merged.dependencies).toEqual({
            dep1: '1.0.0',
            dep2: '1.0.0',
            dep3: '1.1.1',
        });
        expect(merged.devDependencies).toEqual({
            dev1: '1.0.0',
            dev2: '1.0.0',
            dev3: '1.3.4',
        });
    });
    test('dependencies和devDependencies为空时', () => {
        const basePackageJson = {
            name: 'test',
            version: '1.0.0',
        };
        const merged = mergePackageJsons(basePackageJson, [{}, {}]);
        expect(merged.dependencies).toEqual({});
        expect(merged.devDependencies).toEqual({});
    });
});
