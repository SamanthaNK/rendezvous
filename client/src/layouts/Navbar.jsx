import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Search, Menu, X, User, Heart, Calendar, LogOut } from 'lucide-react';
import { selectIsAuthenticated, selectCurrentUser, logout } from '../store/authSlice';
import { authAPI } from '../services/api';
import Container from './Container';
import Button from '../components/common/Button';
import IconButton from '../components/common/IconButton';

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const currentUser = useSelector(selectCurrentUser);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isUserMenuOpen && !event.target.closest('.user-menu-container')) {
                setIsUserMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isUserMenuOpen]);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const toggleUserMenu = () => {
        setIsUserMenuOpen(!isUserMenuOpen);
    };

    const handleLogout = async () => {
        try {
            await authAPI.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            dispatch(logout());
            navigate('/');
            setIsUserMenuOpen(false);
        }
    };

    return (
        <nav
            className={`
        fixed top-0 left-0 right-0 z-40 transition-all duration-300
        ${isScrolled ? 'bg-white shadow-md py-3' : 'bg-white/95 backdrop-blur-sm py-4'}
      `}
        >
            <Container>
                <div className="flex items-center justify-between">
                    <Link
                        to="/"
                        className="flex items-center gap-2 group"
                        aria-label="Rendezvous home"
                    >
                        <div className="w-4 h-4 bg-lime-cream rounded-full transition-transform group-hover:scale-125" />
                        <span className="font-logo text-2xl font-semibold tracking-tight text-ink-black">
                            rendezvous
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center gap-8">
                        <Link
                            to="/events"
                            className="font-body text-base text-gray-700 hover:text-teal transition-colors"
                        >
                            Events
                        </Link>
                        <Link
                            to="/map"
                            className="font-body text-base text-gray-700 hover:text-teal transition-colors"
                        >
                            Map
                        </Link>
                        <Link
                            to="/organizers"
                            className="font-body text-base text-gray-700 hover:text-teal transition-colors"
                        >
                            Organizers
                        </Link>
                    </div>

                    <div className="flex items-center gap-3">
                        <IconButton
                            icon={Search}
                            onClick={() => navigate('/search')}
                            ariaLabel="Search events"
                            variant="ghost"
                            className="hidden md:flex"
                        />

                        {isAuthenticated ? (
                            <div className="relative user-menu-container">
                                <button
                                    onClick={toggleUserMenu}
                                    className="hidden md:flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
                                    aria-label="User menu"
                                    aria-expanded={isUserMenuOpen}
                                >
                                    <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center">
                                        <span className="font-body text-sm font-semibold text-teal">
                                            {currentUser?.name?.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <span className="font-body text-sm font-medium text-ink-black">
                                        {currentUser?.name?.split(' ')[0]}
                                    </span>
                                </button>

                                {isUserMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-dropdown p-2 animate-dropdown-fade">
                                        <Link
                                            to="/profile"
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-ink-black font-body hover:bg-gray-100 transition-colors"
                                            onClick={() => setIsUserMenuOpen(false)}
                                        >
                                            <User className="w-4 h-4" />
                                            <span>Profile</span>
                                        </Link>
                                        <Link
                                            to="/saved"
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-ink-black font-body hover:bg-gray-100 transition-colors"
                                            onClick={() => setIsUserMenuOpen(false)}
                                        >
                                            <Heart className="w-4 h-4" />
                                            <span>Saved Events</span>
                                        </Link>
                                        <Link
                                            to="/planner"
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-ink-black font-body hover:bg-gray-100 transition-colors"
                                            onClick={() => setIsUserMenuOpen(false)}
                                        >
                                            <Calendar className="w-4 h-4" />
                                            <span>My Calendar</span>
                                        </Link>
                                        <div className="h-px bg-gray-200 my-2" />
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-error font-body hover:bg-error/5 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="hidden md:flex items-center gap-3">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate('/login')}
                                >
                                    Login
                                </Button>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => navigate('/register')}
                                >
                                    Sign Up
                                </Button>
                            </div>
                        )}

                        <IconButton
                            icon={isMobileMenuOpen ? X : Menu}
                            onClick={toggleMobileMenu}
                            ariaLabel="Toggle menu"
                            variant="ghost"
                            className="md:hidden"
                        />
                    </div>
                </div>

                {isMobileMenuOpen && (
                    <div className="md:hidden mt-4 pt-4 border-t border-gray-200 space-y-2 animate-fade-in">
                        <Link
                            to="/events"
                            className="block px-4 py-2.5 rounded-md text-base font-body text-gray-700 hover:bg-gray-100 hover:text-teal transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Events
                        </Link>
                        <Link
                            to="/map"
                            className="block px-4 py-2.5 rounded-md text-base font-body text-gray-700 hover:bg-gray-100 hover:text-teal transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Map
                        </Link>
                        <Link
                            to="/organizers"
                            className="block px-4 py-2.5 rounded-md text-base font-body text-gray-700 hover:bg-gray-100 hover:text-teal transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Organizers
                        </Link>
                        <Link
                            to="/search"
                            className="block px-4 py-2.5 rounded-md text-base font-body text-gray-700 hover:bg-gray-100 hover:text-teal transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Search Events
                        </Link>

                        {isAuthenticated ? (
                            <>
                                <div className="h-px bg-gray-200 my-2" />
                                <Link
                                    to="/profile"
                                    className="block px-4 py-2.5 rounded-md text-base font-body text-gray-700 hover:bg-gray-100 hover:text-teal transition-colors"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Profile
                                </Link>
                                <Link
                                    to="/saved"
                                    className="block px-4 py-2.5 rounded-md text-base font-body text-gray-700 hover:bg-gray-100 hover:text-teal transition-colors"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Saved Events
                                </Link>
                                <button
                                    onClick={() => {
                                        handleLogout();
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-2.5 rounded-md text-base font-body text-error hover:bg-error/5 transition-colors"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="h-px bg-gray-200 my-2" />
                                <div className="space-y-2 px-4">
                                    <Button
                                        variant="primary"
                                        fullWidth
                                        onClick={() => {
                                            navigate('/register');
                                            setIsMobileMenuOpen(false);
                                        }}
                                    >
                                        Sign Up
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        fullWidth
                                        onClick={() => {
                                            navigate('/login');
                                            setIsMobileMenuOpen(false);
                                        }}
                                    >
                                        Login
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </Container>
        </nav>
    );
};

export default Navbar;
