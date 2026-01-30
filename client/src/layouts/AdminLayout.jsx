import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { BarChart2, Flag, FileText, UserCheck, Users, List, LogOut, Home } from 'lucide-react';
import { logout } from '../store/authSlice';
import { authAPI } from '../services/api';

const AdminLayout = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleLogout = async () => {
        try {
            await authAPI.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            dispatch(logout());
            navigate('/');
        }
    };

    const menuItems = [
        { label: 'Dashboard', icon: BarChart2, to: '/admin/dashboard' },
        { label: 'Flagged Events', icon: Flag, to: '/admin/flagged-events' },
        { label: 'Reports', icon: FileText, to: '/admin/reports' },
        { label: 'Verification Requests', icon: UserCheck, to: '/admin/verification-requests' },
        { label: 'Users', icon: Users, to: '/admin/users' },
        { label: 'Logs', icon: List, to: '/admin/logs' },
    ];

    return (
        <div className="min-h-screen flex bg-bright-snow">
            <aside className="w-64 bg-ink-black text-white fixed left-0 top-0 bottom-0 flex flex-col">
                <div className="h-20 flex items-center justify-center border-b border-white/10">
                    <h1 className="font-logo text-2xl font-semibold">Admin Panel</h1>
                </div>

                <nav className="flex-1 py-6 px-4 space-y-1">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-md font-body text-sm font-medium transition-colors ${isActive
                                    ? 'bg-teal text-white'
                                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                                }`
                            }
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/10 space-y-2">
                    <button
                        onClick={() => navigate('/')}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-md font-body text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <Home className="w-5 h-5" />
                        Back to Site
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-md font-body text-sm font-medium text-white/70 hover:bg-error/20 hover:text-error transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </aside>

            <main className="flex-1 ml-64 p-8">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;