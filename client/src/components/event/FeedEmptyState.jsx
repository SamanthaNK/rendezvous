import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Sparkles, Heart, Bookmark, Calendar } from 'lucide-react';
import Button from '../common/Button';

const FeedEmptyState = ({ isColdStart, userName }) => {
    const navigate = useNavigate();

    if (isColdStart) {
        return (
            <div className="text-center py-16 px-6 max-w-2xl mx-auto">
                <div className="w-20 h-20 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-10 h-10 text-teal" />
                </div>

                <h2 className="font-heading text-3xl font-bold text-ink-black mb-4">
                    Welcome{userName ? `, ${userName}` : ''}! 🎉
                </h2>

                <p className="font-body text-base text-gray-700 mb-8 leading-relaxed">
                    We're excited to help you discover amazing events in Cameroon.
                    To give you the best recommendations, we need to learn a bit more about your preferences.
                </p>

                <div className="bg-gradient-to-br from-teal/5 to-lime-cream/10 rounded-xl p-6 mb-8 border border-teal/20">
                    <h3 className="font-heading text-lg font-semibold text-ink-black mb-4">
                        Here's how to get started:
                    </h3>

                    <div className="space-y-4 text-left">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-teal/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <Bookmark className="w-4 h-4 text-teal" />
                            </div>
                            <div>
                                <p className="font-body text-sm font-semibold text-ink-black mb-1">
                                    Save Events You Like
                                </p>
                                <p className="font-body text-sm text-gray-600">
                                    Browse events and save the ones that interest you
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-teal/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <Heart className="w-4 h-4 text-teal" />
                            </div>
                            <div>
                                <p className="font-body text-sm font-semibold text-ink-black mb-1">
                                    Mark Events You're Interested In
                                </p>
                                <p className="font-body text-sm text-gray-600">
                                    Let us know what you'd like to attend
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-teal/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <Calendar className="w-4 h-4 text-teal" />
                            </div>
                            <div>
                                <p className="font-body text-sm font-semibold text-ink-black mb-1">
                                    Get Personalized Recommendations
                                </p>
                                <p className="font-body text-sm text-gray-600">
                                    We'll suggest events based on your preferences
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={() => navigate('/')}
                        icon={Sparkles}
                        iconPosition="left"
                    >
                        Explore Events
                    </Button>
                    <Button
                        variant="secondary"
                        size="lg"
                        onClick={() => navigate('/profile')}
                    >
                        Update Preferences
                    </Button>
                </div>

                <p className="font-body text-sm text-gray-500 mt-8">
                    The more you interact, the better your recommendations become
                </p>
            </div>
        );
    }

    return (
        <div className="text-center py-16 px-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-heading text-xl font-bold text-ink-black mb-2">
                No Events Found
            </h3>
            <p className="font-body text-base text-gray-600 mb-6">
                We couldn't find any events matching your preferences right now.
            </p>
            <Button variant="primary" size="lg" onClick={() => navigate('/')}>
                Browse All Events
            </Button>
        </div>
    );
};

FeedEmptyState.propTypes = {
    isColdStart: PropTypes.bool,
    userName: PropTypes.string,
};

export default FeedEmptyState;