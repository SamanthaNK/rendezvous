import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Search, Menu, X, User, Heart, LogOut, Clock, Calendar } from 'lucide-react';
import { selectIsAuthenticated, selectCurrentUser, logout } from '../store/authSlice';
import { selectSearchHistory, addToHistory } from '../store/searchSlice';
import { authAPI } from '../services/api';
import Container from './Container';
import Button from '../components/common/Button';
import IconButton from '../components/common/IconButton';

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const currentUser = useSelector(selectCurrentUser);
    const searchHistory = useSelector(selectSearchHistory);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const searchRef = useRef(null);

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
            if (isSearchOpen && searchRef.current && !searchRef.current.contains(event.target)) {
                setIsSearchOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isUserMenuOpen, isSearchOpen]);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const toggleUserMenu = () => {
        setIsUserMenuOpen(!isUserMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
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
            closeMobileMenu();
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchValue.trim()) {
            dispatch(addToHistory(searchValue));
            navigate(`/search?q=${encodeURIComponent(searchValue)}`);
            setSearchValue('');
            setIsSearchOpen(false);
        }
    };

    const handleHistoryClick = (query) => {
        navigate(`/search?q=${encodeURIComponent(query)}`);
        setIsSearchOpen(false);
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
                        onClick={closeMobileMenu}
                    >
                        <div className="w-4 h-4 bg-lime-cream rounded-full transition-transform group-hover:scale-125" />
                        <span className="font-logo text-2xl font-semibold tracking-tight text-ink-black">
                            rendezvous
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center gap-8">
                        <Link
                            to="/"
                            className="font-body text-base text-gray-700 hover:text-teal transition-colors"
                        >
                            Events
                        </Link>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative hidden md:block" ref={searchRef}>
                            <IconButton
                                icon={Search}
                                onClick={() => setIsSearchOpen(!isSearchOpen)}
                                ariaLabel="Search events"
                                variant="ghost"
                            />

                            {isSearchOpen && (
                                <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl border border-gray-200 shadow-dropdown p-4 animate-dropdown-fade">
                                    <form onSubmit={handleSearch} className="mb-3">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                            <input
                                                type="text"
                                                value={searchValue}
                                                onChange={(e) => setSearchValue(e.target.value)}
                                                placeholder="Search events..."
                                                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-teal"
                                                autoFocus
                                            />
                                        </div>
                                    </form>

                                    {isAuthenticated && searchHistory.length > 0 && (
                                        <div className="border-t border-gray-100 pt-3">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Clock className="w-4 h-4 text-gray-400" />
                                                <p className="font-body text-xs font-semibold text-gray-500 uppercase">
                                                    Recent Searches
                                                </p>
                                            </div>
                                            <div className="space-y-1 max-h-48 overflow-y-auto">
                                                {searchHistory.slice(0, 5).map((query, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => handleHistoryClick(query)}
                                                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                                                    >
                                                        {query}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

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
                                            to="/saved"
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-ink-black font-body hover:bg-gray-100 transition-colors"
                                            onClick={() => setIsUserMenuOpen(false)}
                                        >
                                            <Heart className="w-4 h-4" />
                                            <span>Saved Events</span>
                                        </Link>
                                        {currentUser?.role === 'organizer' && (
                                            <>
                                                <div className="h-px bg-gray-200 my-2" />
                                                <Link
                                                    to="/organizer/dashboard"
                                                    className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-ink-black font-body hover:bg-gray-100 transition-colors"
                                                    onClick={() => setIsUserMenuOpen(false)}
                                                >
                                                    <Calendar className="w-4 h-4" />
                                                    <span>Organizer Dashboard</span>
                                                </Link>
                                            </>
                                        )}
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
                            to="/"
                            className="block px-4 py-2.5 rounded-md text-base font-body text-gray-700 hover:bg-gray-100 hover:text-teal transition-colors"
                            onClick={closeMobileMenu}
                        >
                            Events
                        </Link>
                        <Link
                            to="/search"
                            className="block px-4 py-2.5 rounded-md text-base font-body text-gray-700 hover:bg-gray-100 hover:text-teal transition-colors"
                            onClick={closeMobileMenu}
                        >
                            Search Events
                        </Link>

                        {isAuthenticated ? (
                            <>
                                <div className="h-px bg-gray-200 my-2" />
                                <Link
                                    to="/saved"
                                    className="block px-4 py-2.5 rounded-md text-base font-body text-gray-700 hover:bg-gray-100 hover:text-teal transition-colors"
                                    onClick={closeMobileMenu}
                                >
                                    Saved Events
                                </Link>
                                {currentUser?.role === 'organizer' && (
                                    <Link
                                        to="/organizer/dashboard"
                                        className="block px-4 py-2.5 rounded-md text-base font-body text-gray-700 hover:bg-gray-100 hover:text-teal transition-colors"
                                        onClick={closeMobileMenu}
                                    >
                                        Organizer Dashboard
                                    </Link>
                                )}
                                <button
                                    onClick={handleLogout}
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
                                            closeMobileMenu();
                                        }}
                                    >
                                        Sign Up
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        fullWidth
                                        onClick={() => {
                                            navigate('/login');
                                            closeMobileMenu();
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