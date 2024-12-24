import { Suspense } from 'react';
import { Outlet } from 'react-router';

function index() {
    return (
        <div style={{ width: '100%', height: '100vh' }}>
            <div
                style={{
                    width: '100%',
                    height: 40,
                    backgroundColor: 'blue',
                    color: 'white',
                }}
            >
                头部
            </div>
            <div style={{ width: '100%', height: 'calc(100% - 40px)' }}>
                <Suspense>
                    <Outlet />
                </Suspense>
            </div>
        </div>
    );
}

export default index;
