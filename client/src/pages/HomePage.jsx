import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Search, MapPin, Filter, X } from 'lucide-react';
import { selectIsAuthenticated, selectCurrentUser } from '../store/authSlice';
import Container from '../layouts/Container';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import EventGrid from '../components/event/EventGrid';
import FilterSidebar from '../components/event/FilterSidebar';
import { eventsAPI } from '../services/api';

const HomePage = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);

  // State management
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [activeFilter, setActiveFilter] = useState(null);
  const [filters, setFilters] = useState({
    categories: [],
    dateRange: 'all',
    priceRange: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    hasMore: true,
  });
  const [bookmarkedEvents, setBookmarkedEvents] = useState([]);

  // Available categories (could be fetched from API)
  const categories = [
    'Music', 'Technology', 'Sports', 'Arts', 'Food & Drink',
    'Business', 'Education', 'Health', 'Community', 'Entertainment',
  ];

  // Filter pills
  const filterPills = [
    { id: 'tonight', label: 'Tonight', icon: '🌙' },
    { id: 'free', label: 'Free Events', icon: '🎟️' },
    { id: 'weekend', label: 'This Weekend', icon: '📅' },
    { id: 'music', label: 'Music', icon: '🎵' },
  ];

  // Fetch events
  const fetchEvents = async (loadMore = false) => {
    try {
      setLoading(!loadMore);

      const params = {
        page: loadMore ? pagination.page + 1 : 1,
        limit: pagination.limit,
        search: searchQuery || undefined,
        location: selectedLocation !== 'All Locations' ? selectedLocation : undefined,
        categories: filters.categories.length > 0 ? filters.categories.join(',') : undefined,
        dateRange: filters.dateRange !== 'all' ? filters.dateRange : undefined,
        priceRange: filters.priceRange !== 'all' ? filters.priceRange : undefined,
        filter: activeFilter || undefined,
      };

      const response = await eventsAPI.getAll(params);
      const newEvents = response.data.events || [];

      if (loadMore) {
        setEvents(prev => [...prev, ...newEvents]);
        setPagination(prev => ({
          ...prev,
          page: prev.page + 1,
          hasMore: newEvents.length === prev.limit,
        }));
      } else {
        setEvents(newEvents);
        setPagination(prev => ({
          ...prev,
          page: 1,
          total: response.data.total || 0,
          hasMore: newEvents.length === prev.limit,
        }));
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  // Handle filter pill click
  const handleFilterPillClick = (filterId) => {
    if (activeFilter === filterId) {
      setActiveFilter(null);
    } else {
      setActiveFilter(filterId);
      // Reset other filters when using quick filters
      setFilters({
        categories: filterId === 'music' ? ['Music'] : [],
        dateRange: filterId === 'tonight' ? 'today' : filterId === 'weekend' ? 'weekend' : 'all',
        priceRange: filterId === 'free' ? 'free' : 'all',
      });
    }
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle bookmark toggle
  const handleBookmarkToggle = async (eventId) => {
    if (!isAuthenticated) {
      return;
    }

    try {
      const isBookmarked = bookmarkedEvents.includes(eventId);
      if (isBookmarked) {
        await eventsAPI.unsave(eventId);
        setBookmarkedEvents(prev => prev.filter(id => id !== eventId));
      } else {
        await eventsAPI.save(eventId);
        setBookmarkedEvents(prev => [...prev, eventId]);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  // Load more events
  const loadMore = () => {
    if (!loading && pagination.hasMore) {
      fetchEvents(true);
    }
  };

  // Initial load
  useEffect(() => {
    fetchEvents();
  }, [activeFilter, filters, selectedLocation]);

  // Load user bookmarks if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const loadBookmarks = async () => {
        try {
          const response = await eventsAPI.getSaved();
          setBookmarkedEvents(response.data.map(event => event.id));
        } catch (error) {
          console.error('Error loading bookmarks:', error);
        }
      };
      loadBookmarks();
    }
  }, [isAuthenticated]);

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="relative bg-dark-amaranth overflow-hidden py-20 md:py-24">
        <div
          className="absolute inset-0 opacity-[0.075] pointer-events-none"
          style={{
            backgroundImage: 'url(/patterns/bubbles.svg)',
            backgroundSize: '200px',
          }}
        />

        <Container className="relative z-10">
          <div className="max-w-4xl">
            <h1 className="font-heading text-4xl md:text-6xl font-bold text-white mb-6">
                            Discover Events in <span className="text-green-500">Cam</span><span className="text-red-500">er</span><span className="text-yellow-300">oon</span>
            </h1>
            <p className="font-body text-lg md:text-xl text-white/90 mb-8 leading-relaxed">
                            Find concerts, festivals, workshops, tech talks, and more happening near you.
                            All your events in one place.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mb-6">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Search events, artists, venues..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder-white/60 focus:bg-white focus:text-ink-black"
                    icon={Search}
                  />
                </div>
                <div className="md:w-48">
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/60 focus:bg-white focus:text-ink-black focus:border-white transition-colors"
                  >
                    <option value="All Locations">All Locations</option>
                    <option value="Yaoundé">Yaoundé</option>
                    <option value="Douala">Douala</option>
                    <option value="Bamenda">Bamenda</option>
                    <option value="Bafoussam">Bafoussam</option>
                    <option value="Limbe">Limbe</option>
                  </select>
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  className="bg-white text-dark-amaranth hover:bg-white/90 px-6"
                >
                                    Search
                </Button>
              </div>
            </form>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2">
              {filterPills.map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => handleFilterPillClick(pill.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeFilter === pill.id
                      ? 'bg-white text-dark-amaranth'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <span>{pill.icon}</span>
                  {pill.label}
                  {activeFilter === pill.id && (
                    <X size={14} className="ml-1" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Events Section */}
      <Container className="py-8 md:py-12">
        <div className="flex gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-heading text-2xl font-bold text-ink-black mb-1">
                  {loading ? 'Loading events...' : `${pagination.total} Events Found`}
                </h2>
                {searchQuery && (
                  <p className="font-body text-gray-600">
                                        Results for "{searchQuery}"
                  </p>
                )}
              </div>

              {/* Mobile Filter Toggle */}
              <Button
                onClick={() => setShowFilters(true)}
                variant="secondary"
                className="lg:hidden"
                icon={Filter}
                iconPosition="left"
              >
                                Filters
              </Button>
            </div>

            {/* Event Grid */}
            <EventGrid
              events={events}
              loading={loading}
              onBookmarkToggle={handleBookmarkToggle}
              bookmarkedEvents={bookmarkedEvents}
            />

            {/* Load More */}
            {pagination.hasMore && !loading && (
              <div className="text-center mt-8">
                <Button
                  onClick={loadMore}
                  variant="secondary"
                  size="lg"
                >
                                    Load More Events
                </Button>
              </div>
            )}
          </div>

          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block w-80">
            <FilterSidebar
              filters={filters}
              onFiltersChange={(newFilters) => {
                setFilters(newFilters);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              categories={categories}
            />
          </div>
        </div>
      </Container>

      {/* Mobile Filter Sidebar */}
      <FilterSidebar
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFiltersChange={(newFilters) => {
          setFilters(newFilters);
          setPagination(prev => ({ ...prev, page: 1 }));
          setShowFilters(false);
        }}
        categories={categories}
      />
    </div>
  );
};

export default HomePage;
