export interface DepConfig {
    /**
     * 项目名称
     */
    name: string;
    /**
     * 项目git地址
     */
    remote: string;
    /**
     * 项目分支
     */
    branch: string;
    /**
     * 项目版本
     */
    version?: string;
}
export function definedConfig(config: DepConfig[]): DepConfig[] {
    return config;
}
