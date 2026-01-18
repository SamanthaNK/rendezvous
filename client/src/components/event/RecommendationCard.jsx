import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import {
    Calendar,
    MapPin,
    Heart,
    Banknote,
    Bookmark,
    TrendingUp,
    Sparkles,
    X,
    User
} from 'lucide-react';
import { Image as ImageIcon } from 'lucide-react';
import { selectIsAuthenticated } from '../../store/authSlice';
import { eventsAPI } from '../../services/api';
import { formatDate, isToday } from '../../utils/dateHelpers';

const RecommendationCard = ({ event, onSaveToggle, onInterestedToggle, onNotInterested }) => {
    const navigate = useNavigate();
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const [isSaved, setIsSaved] = useState(event.isSaved || false);
    const [isInterested, setIsInterested] = useState(event.isInterested || false);
    const [interestedCount, setInterestedCount] = useState(event.metrics?.interested || 0);
    const [actionLoading, setActionLoading] = useState(false);
    const [isHidden, setIsHidden] = useState(false);

    const isTonightEvent = isToday(event.date);
    const formattedDate = formatDate(event.date, 'short');

    const handleCardClick = () => {
        navigate(`/events/${event._id}`);
    };

    const handleSaveClick = async (e) => {
        e.stopPropagation();
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        if (actionLoading) return;

        try {
            setActionLoading(true);
            const newSavedState = !isSaved;

            if (newSavedState) {
                await eventsAPI.save(event._id);
            } else {
                await eventsAPI.unsave(event._id);
            }

            setIsSaved(newSavedState);
            if (onSaveToggle) {
                onSaveToggle(event._id, newSavedState);
            }
        } catch (error) {
            console.error('Save toggle error:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleInterestedClick = async (e) => {
        e.stopPropagation();
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        if (actionLoading) return;

        try {
            setActionLoading(true);
            const newInterestedState = !isInterested;

            if (newInterestedState) {
                await eventsAPI.markInterested(event._id);
                setInterestedCount((prev) => prev + 1);
            } else {
                await eventsAPI.unmarkInterested(event._id);
                setInterestedCount((prev) => Math.max(0, prev - 1));
            }

            setIsInterested(newInterestedState);
            if (onInterestedToggle) {
                onInterestedToggle(event._id, newInterestedState);
            }
        } catch (error) {
            console.error('Interested toggle error:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleNotInterested = (e) => {
        e.stopPropagation();
        setIsHidden(true);
        if (onNotInterested) {
            onNotInterested(event._id);
        }
    };

    if (isHidden) {
        return null;
    }

    return (
        <div
            className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:-translate-y-1 hover:shadow-card-hover transition-all duration-300 ease-out cursor-pointer flex flex-col relative"
            onClick={handleCardClick}
        >
            {/* Not Interested Button */}
            {onNotInterested && (
                <button
                    onClick={handleNotInterested}
                    className="absolute top-3 left-3 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                    aria-label="Not interested"
                    title="Not interested in this event"
                >
                    <X className="w-4 h-4 text-gray-600" />
                </button>
            )}

            <div className="relative h-[180px] overflow-hidden bg-gray-100 flex-shrink-0">
                {event.images?.[0] ? (
                    <img
                        src={event.images[0]}
                        alt={event.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <ImageIcon className="w-16 h-16 text-gray-400" />
                    </div>
                )}

                {/* Special Badges */}
                <div className="absolute top-3 right-3 flex flex-col gap-2">
                    {isTonightEvent && (
                        <span className="px-3 py-1 bg-lime-cream/90 text-ink-black text-xs font-semibold rounded-full backdrop-blur-sm">
                            Tonight
                        </span>
                    )}
                    {event.isTrending && (
                        <span className="px-3 py-1 bg-warning/90 text-white text-xs font-semibold rounded-full backdrop-blur-sm flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Trending
                        </span>
                    )}
                    {event.fromFollowedOrganizer && (
                        <span className="px-3 py-1 bg-teal/90 text-white text-xs font-semibold rounded-full backdrop-blur-sm flex items-center gap-1">
                            <User className="w-3 h-3" />
                            Following
                        </span>
                    )}
                </div>

                <button
                    onClick={handleSaveClick}
                    disabled={actionLoading}
                    className="absolute bottom-3 right-3 w-9 h-9 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all duration-200 disabled:opacity-50 shadow-lg"
                    aria-label={isSaved ? 'Remove from saved' : 'Save event'}
                >
                    <Bookmark
                        className={`w-5 h-5 transition-colors ${isSaved ? 'fill-teal text-teal' : 'text-gray-600'
                            }`}
                    />
                </button>
            </div>

            <div className="p-4 flex flex-col flex-1">
                {/* Explanation Label */}
                {event.explanation && (
                    <div className="flex items-center gap-2 mb-3 px-3 py-1.5 bg-teal/5 rounded-md">
                        <Sparkles className="w-3.5 h-3.5 text-teal flex-shrink-0" />
                        <span className="font-body text-xs text-teal font-medium">
                            {event.explanation}
                        </span>
                    </div>
                )}

                <span className="inline-block px-3 py-1 bg-dark-amaranth/10 text-dark-amaranth text-xs font-semibold rounded-full mb-3 self-start">
                    {event.categories?.[0] || 'Event'}
                </span>

                <h3 className="font-heading text-lg font-semibold text-ink-black mb-3 line-clamp-2 leading-snug">
                    {event.title}
                </h3>

                <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-teal flex-shrink-0" />
                        <span className="font-body text-sm text-gray-600 truncate">
                            {formattedDate}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-teal flex-shrink-0" />
                        <span className="font-body text-sm text-gray-600 truncate">
                            {event.location?.city || 'Location TBA'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Banknote className="w-4 h-4 text-teal flex-shrink-0" />
                        <span className="font-body text-sm text-gray-600 truncate">
                            {event.isFree ? 'Free' : `${event.price} FCFA`}
                        </span>
                    </div>
                    <button
                        onClick={handleInterestedClick}
                        disabled={actionLoading}
                        className="flex items-center gap-2 hover:text-lime-cream transition-colors disabled:opacity-50"
                    >
                        <Heart
                            className={`w-4 h-4 flex-shrink-0 transition-colors ${isInterested ? 'fill-lime-cream text-lime-cream' : 'text-gray-600'
                                }`}
                        />
                        <span className="font-body text-sm text-gray-600">{interestedCount}</span>
                    </button>
                </div>

                <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="font-body text-sm text-gray-600 truncate">
                            {event.organizer?.name || 'Organizer'}
                        </span>
                        {event.organizer?.isVerified && (
                            <div
                                className="w-4 h-4 bg-teal rounded-full flex items-center justify-center flex-shrink-0"
                                title="Verified Organizer"
                            >
                                <svg
                                    className="w-3 h-3 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

RecommendationCard.propTypes = {
    event: PropTypes.shape({
        _id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        categories: PropTypes.arrayOf(PropTypes.string),
        date: PropTypes.string.isRequired,
        location: PropTypes.shape({
            city: PropTypes.string,
        }),
        price: PropTypes.number,
        isFree: PropTypes.bool,
        images: PropTypes.arrayOf(PropTypes.string),
        metrics: PropTypes.shape({
            interested: PropTypes.number,
        }),
        organizer: PropTypes.shape({
            name: PropTypes.string,
            isVerified: PropTypes.bool,
        }),
        isSaved: PropTypes.bool,
        isInterested: PropTypes.bool,
        explanation: PropTypes.string,
        isTrending: PropTypes.bool,
        fromFollowedOrganizer: PropTypes.bool,
    }).isRequired,
    onSaveToggle: PropTypes.func,
    onInterestedToggle: PropTypes.func,
    onNotInterested: PropTypes.func,
};

export default RecommendationCard;