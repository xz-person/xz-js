import { createBrowserRouter, RouteObject } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import * as routeMap from './shared/route-map';
type RouteMap = typeof routeMap;
function createRoutes(routeMap: RouteMap) {
    const routes: RouteObject[] = [];
    let rootRoute: RouteObject = {
        path: '/',
        element: <routeMap.BFLayout />,
        children: [],
    };
    let routePrefix = '';
    let routePrefixLowerCase = '';
    let routePrefixRoot = '/';
    let routePrefixRootRoute: RouteObject = {};
    Object.keys(routeMap).forEach((key) => {
        const RouteCom = routeMap[key as keyof typeof routeMap];
        if (key === 'BFLayout') {
            routes.push(rootRoute);
        } else if (key.startsWith('BF')) {
            rootRoute.children?.push({
                path: key.toLowerCase(),
                element: <RouteCom />,
            });
        } else if (key.endsWith('Layout')) {
            routePrefix = key.split('Layout')[0];
            routePrefixLowerCase = routePrefix.toLowerCase();
            routePrefixRoot = `/${routePrefixLowerCase}`;
            routePrefixRootRoute = {
                path: routePrefixRoot,
                element: <RouteCom />,
                children: [],
            };
            rootRoute.children?.push(routePrefixRootRoute);
        } else if (key.startsWith(routePrefix)) {
            routePrefixRootRoute.children?.push({
                path: key.toLowerCase(),
                element: <RouteCom />,
            });
        }
    });
    return routes;
}
const router = createBrowserRouter(createRoutes(routeMap));

export default function Router() {
    return <RouterProvider router={router} />;
}
