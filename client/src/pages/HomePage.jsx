import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Search, MapPin, Calendar } from 'lucide-react';
import { selectIsAuthenticated, selectCurrentUser } from '../store/authSlice';
import Container from '../layouts/Container';
import Button from '../components/common/Button';

function HomePage() {
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const currentUser = useSelector(selectCurrentUser);

    return (
        <div className="pt-20">
            <section className="relative bg-dark-amaranth overflow-hidden py-20 md:py-24">
                <div
                    className="absolute inset-0 opacity-[0.075] pointer-events-none"
                    style={{
                        backgroundImage: 'url(/patterns/bubbles.svg)',
                        backgroundSize: '200px',
                    }}
                />

                <Container className="relative z-10">
                    <div className="max-w-3xl">
                        <h1 className="font-heading text-4xl md:text-6xl font-bold text-white mb-6">
                            Discover Events in <span className="text-green-500">Cam</span><span className="text-red-500">er</span><span className="text-yellow-300">oon</span>
                        </h1>
                        <p className="font-body text-lg md:text-xl text-white/90 mb-8 leading-relaxed">
                            Find concerts, festivals, workshops, tech talks, and more happening near you.
                            All your events in one place.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            {isAuthenticated ? (
                                <>
                                    <Link to="/events">
                                        <Button variant="primary" size="lg" icon={Search} iconPosition="left">
                                            Explore Events
                                        </Button>
                                    </Link>
                                    <Link to="/map">
                                        <Button
                                            variant="secondary"
                                            size="lg"
                                            icon={MapPin}
                                            iconPosition="left"
                                            className="bg-white/10 border-white text-white hover:bg-white hover:text-dark-amaranth"
                                        >
                                            View Map
                                        </Button>
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link to="/register">
                                        <Button variant="primary" size="lg">
                                            Get Started
                                        </Button>
                                    </Link>
                                    <Link to="/login">
                                        <Button
                                            variant="secondary"
                                            size="lg"
                                            className="bg-white/10 border-white text-white hover:bg-white hover:text-dark-amaranth"
                                        >
                                            Login
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </Container>
            </section>

            <Container className="py-16 md:py-20">
                {isAuthenticated ? (
                    <div>
                        <h2 className="font-heading text-3xl font-bold text-ink-black mb-2">
                            Welcome back, {currentUser?.name?.split(' ')[0]}
                        </h2>
                        <p className="font-body text-base text-gray-600 mb-8">
                            Your personalized event feed is coming soon
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="w-8 h-8 text-teal" />
                            </div>
                            <h3 className="font-heading text-xl font-bold text-ink-black mb-2">
                                Discover Events
                            </h3>
                            <p className="font-body text-base text-gray-600">
                                Find events that match your interests using AI-powered search
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MapPin className="w-8 h-8 text-teal" />
                            </div>
                            <h3 className="font-heading text-xl font-bold text-ink-black mb-2">
                                Explore Your City
                            </h3>
                            <p className="font-body text-base text-gray-600">
                                View events on an interactive map and discover what's nearby
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Calendar className="w-8 h-8 text-teal" />
                            </div>
                            <h3 className="font-heading text-xl font-bold text-ink-black mb-2">
                                Never Miss Out
                            </h3>
                            <p className="font-body text-base text-gray-600">
                                Save events and get reminders so you never miss the fun
                            </p>
                        </div>
                    </div>
                )}
            </Container>
        </div>
    );
}

export default HomePage;