/**
 * 导出的路由，采用具名导出，且用lazy懒加载
 * 格式为【项目名称不带前缀(全部大写)】【page组件名称（大驼峰）】
 * 如：export const XXAbb = lazy(() => import('@src/xz-xx/pages/abb'));
 * 其中XX为项目名称不带前缀(全部大写)，Abb为page组件名称
 * 默认导出一个布局组件，用于包裹当前项目下的所有路由,路径为@src/xz-xx/pages/index.tsx
 * 请先手动为Layout组件加上前缀
 */
import { lazy } from 'react';

export const Layout = lazy(() => import('@src/xz-app/pages'));
