import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Share2,
  Bookmark,
  Heart,
  ArrowLeft,
  Check,
  ExternalLink,
} from 'lucide-react';
import { selectIsAuthenticated } from '../store/authSlice';
import Container from '../layouts/Container';
import Button from '../components/common/Button';
import EventCard from '../components/event/EventCard';
import { eventsAPI } from '../services/api';

const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // State management
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isInterested, setIsInterested] = useState(false);
  const [interestedCount, setInterestedCount] = useState(0);
  const [similarEvents, setSimilarEvents] = useState([]);
  const [shareSuccess, setShareSuccess] = useState(false);

  // Fetch event details
  const fetchEventDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await eventsAPI.getById(id);
      const eventData = response.data;

      setEvent(eventData);
      setIsSaved(eventData.isSaved || false);
      setIsInterested(eventData.isInterested || false);
      setInterestedCount(eventData.interestedCount || 0);

      // Fetch similar events
      if (eventData.category) {
        const similarResponse = await eventsAPI.getAll({
          categories: eventData.category,
          limit: 4,
          exclude: id,
        });
        setSimilarEvents(similarResponse.data.events || []);
      }
    } catch (err) {
      console.error('Error fetching event details:', err);
      setError(err.message || 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Handle save/unsave
  const handleSaveToggle = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      if (isSaved) {
        await eventsAPI.unsave(id);
        setIsSaved(false);
      } else {
        await eventsAPI.save(id);
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  // Handle interested/uninterested
  const handleInterestedToggle = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      if (isInterested) {
        await eventsAPI.unmarkInterested(id);
        setIsInterested(false);
        setInterestedCount(prev => Math.max(0, prev - 1));
      } else {
        await eventsAPI.markInterested(id);
        setIsInterested(true);
        setInterestedCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling interest:', error);
    }
  };

  // Handle share
  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.title,
          text: `Check out this event: ${event?.title}`,
          url,
        });
      } catch (error) {
        // User cancelled share or error occurred
        copyToClipboard(url);
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    });
  };

  // Format date and time
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Load event on mount
  useEffect(() => {
    if (id) {
      fetchEventDetails();
    }
  }, [id, fetchEventDetails]);

  if (loading) {
    return (
      <div className="min-h-screen pt-20">
        <Container className="py-8">
          <div className="animate-pulse">
            <div className="h-96 bg-gray-200 rounded-lg mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-32 bg-gray-200 rounded" />
                <div className="h-24 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen pt-20">
        <Container className="py-16">
          <div className="text-center">
            <h1 className="font-heading text-3xl font-bold text-ink-black mb-4">
              {error || 'Event Not Found'}
            </h1>
            <p className="font-body text-gray-600 mb-8">
                            The event you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate('/')} variant="primary">
                            Back to Home
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20">
      {/* Back Button */}
      <Container className="py-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-ink-black transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-body">Back</span>
        </button>
      </Container>

      {/* Hero Image */}
      <div className="relative h-96 lg:h-[500px] overflow-hidden">
        <img
          src={event.image || '/placeholder-event.jpg'}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-30" />

        {/* Event Category Badge */}
        <div className="absolute top-6 left-6">
          <span className="bg-teal text-white px-3 py-1 rounded-full text-sm font-semibold">
            {event.category}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-6 right-6 flex gap-3">
          <button
            onClick={handleShare}
            className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            title="Share event"
          >
            <Share2 size={18} />
          </button>
          <button
            onClick={handleSaveToggle}
            className={`w-10 h-10 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors ${
              isSaved
                ? 'bg-teal text-white'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
            title={isSaved ? 'Remove from saved' : 'Save event'}
          >
            <Bookmark size={18} className={isSaved ? 'fill-current' : ''} />
          </button>
        </div>
      </div>

      <Container className="py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Event Header */}
            <div>
              <h1 className="font-heading text-3xl lg:text-4xl font-bold text-ink-black mb-4">
                {event.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-6">
                <div className="flex items-center gap-2">
                  <Calendar size={18} />
                  <span className="font-body">{formatDate(event.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={18} />
                  <span className="font-body">{formatTime(event.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={18} />
                  <span className="font-body">{event.location}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <Button
                  onClick={handleInterestedToggle}
                  variant={isInterested ? 'secondary' : 'primary'}
                  size="lg"
                  icon={Heart}
                  iconPosition="left"
                  className={`flex-1 sm:flex-none ${
                    isInterested ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : ''
                  }`}
                >
                  {isInterested ? (
                    <>
                      <Check size={18} className="mr-2" />
                                            Interested
                    </>
                  ) : (
                    <>
                      <Heart size={18} className="mr-2" />
                                            I'm Interested
                    </>
                  )}
                </Button>

                <div className="flex items-center gap-2 text-gray-600">
                  <Users size={18} />
                  <span className="font-body text-sm">
                    {interestedCount} people interested
                  </span>
                </div>
              </div>
            </div>

            {/* Event Description */}
            <div>
              <h2 className="font-heading text-2xl font-bold text-ink-black mb-4">
                                About This Event
              </h2>
              <div className="font-body text-gray-700 leading-relaxed whitespace-pre-line">
                {event.description}
              </div>
            </div>

            {/* Organizer Info */}
            <div>
              <h2 className="font-heading text-2xl font-bold text-ink-black mb-4">
                                Organizer
              </h2>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-teal rounded-full flex items-center justify-center text-white font-semibold">
                  {event.organizer?.name?.charAt(0)?.toUpperCase() || 'O'}
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-ink-black">
                    {event.organizer?.name}
                  </h3>
                  {event.organizer?.verified && (
                    <div className="flex items-center gap-1 text-teal mt-1">
                      <Check size={14} />
                      <span className="text-sm font-medium">Verified Organizer</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Map Placeholder */}
            <div>
              <h2 className="font-heading text-2xl font-bold text-ink-black mb-4">
                                Location
              </h2>
              <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
                <div className="text-center">
                  <MapPin size={48} className="text-gray-400 mx-auto mb-2" />
                  <p className="font-body text-gray-600">
                                        Interactive map coming soon
                  </p>
                  <p className="font-body text-sm text-gray-500 mt-1">
                    {event.location}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Event Info Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="font-heading text-lg font-bold text-ink-black mb-4">
                                Event Details
              </h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="text-teal mt-0.5 flex-shrink-0" size={18} />
                  <div>
                    <p className="font-body font-semibold text-ink-black">
                      {formatDate(event.date)}
                    </p>
                    <p className="font-body text-sm text-gray-600">
                      {formatTime(event.date)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="text-teal mt-0.5 flex-shrink-0" size={18} />
                  <div>
                    <p className="font-body font-semibold text-ink-black">
                                            Location
                    </p>
                    <p className="font-body text-sm text-gray-600">
                      {event.location}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="text-teal mt-0.5 flex-shrink-0" size={18} />
                  <div>
                    <p className="font-body font-semibold text-ink-black">
                                            Price
                    </p>
                    <p className="font-body text-sm text-gray-600">
                      {event.price === 0 ? 'Free' : `$${event.price}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Share Success Message */}
              {shareSuccess && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="font-body text-sm text-green-800">
                                        Link copied to clipboard!
                  </p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="font-heading text-lg font-bold text-ink-black mb-4">
                                Quick Actions
              </h3>

              <div className="space-y-3">
                <Button
                  onClick={handleShare}
                  variant="secondary"
                  fullWidth
                  icon={Share2}
                  iconPosition="left"
                >
                                    Share Event
                </Button>

                <Button
                  onClick={() => window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${new Date(event.date).toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${new Date(event.date).toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`, '_blank')}
                  variant="secondary"
                  fullWidth
                  icon={ExternalLink}
                  iconPosition="left"
                >
                                    Add to Calendar
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Events */}
        {similarEvents.length > 0 && (
          <div className="mt-12">
            <h2 className="font-heading text-2xl font-bold text-ink-black mb-6">
                            Similar Events
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarEvents.map((similarEvent) => (
                <EventCard
                  key={similarEvent.id}
                  event={similarEvent}
                  onBookmarkToggle={() => {}} // Similar events don't need bookmark toggle
                />
              ))}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
};

export default EventDetailsPage;
