import semver from 'semver';

interface Dependencies {
    [key: string]: string;
}

export interface PackageJson {
    dependencies?: Dependencies;
    devDependencies?: Dependencies;
    [key: string]: any;
}

export function mergePackageJsons(
    base: PackageJson,
    others: PackageJson[]
): PackageJson {
    if (!others.length) return base;
    const newPackageJson = others.reduce((prev, cur) => {
        prev.dependencies = mergeDependencies(
            prev.dependencies || {},
            cur.dependencies || {}
        );
        prev.devDependencies = mergeDependencies(
            prev.devDependencies || {},
            cur.devDependencies || {}
        );
        return prev;
    }, base);
    return newPackageJson;
}

export function mergeDependencies(
    dependencies1: Dependencies,
    dependencies2: Dependencies
): Dependencies {
    const newDependencies: Dependencies = {};
    for (const key in dependencies1) {
        if (!dependencies1.hasOwnProperty(key)) continue;
        if (!dependencies2[key]) {
            newDependencies[key] =
                getValidVersion(dependencies1[key]) || dependencies1[key];
        } else {
            newDependencies[key] = handleSameDependenciesVersions([
                dependencies1[key],
                dependencies2[key],
            ]);
        }
    }
    return Object.assign({}, dependencies2, newDependencies);
}

function handleSameDependenciesVersions(versions: [string, string]): string {
    if (versions[0] === versions[1] || !getValidVersion(versions[0])) {
        return versions[0];
    }
    const validVersions = versions.map((version) => getValidVersion(version)!);
    return semver.sort(validVersions, true)[1];
}

function getValidVersion(version: string): string | null {
    try {
        const validVersion = semver.valid(semver.coerce(version));
        return validVersion;
    } catch (e) {
        return version;
    }
}
