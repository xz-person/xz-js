import { Outlet } from 'react-router';
function index() {
    return (
        <div className="xz-app">
            <Outlet />
        </div>
    );
}

export default index;
