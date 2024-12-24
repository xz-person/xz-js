import { lazy } from 'react';

export { default as BFLayout } from '@src/xz-bf/pages';
export const BFOne = lazy(() => import('@src/xz-bf/pages/one'));
export const BFTwo = lazy(() => import('@src/xz-bf/pages/two'));
export const BFThree = lazy(() => import('@src/xz-bf/pages/three'));
