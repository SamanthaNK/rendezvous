import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Search, MapPin, SlidersHorizontal, X } from 'lucide-react';
import { selectIsAuthenticated, selectCurrentUser } from '../store/authSlice';
import { eventsAPI } from '../services/api';
import { setView, selectView } from '../store/viewSlice';
import Container from '../layouts/Container';
import Button from '../components/common/Button';
import EventGrid from '../components/event/EventGrid';
import FilterSidebar from '../components/event/FilterSidebar';
import MapViewPage from './MapViewPage';

const CITIES = [
  { label: 'Douala', value: 'Douala' },
  { label: 'Yaoundé', value: 'Yaoundé' },
  { label: 'Garoua', value: 'Garoua' },
  { label: 'Bamenda', value: 'Bamenda' },
  { label: 'Bafoussam', value: 'Bafoussam' },
  { label: 'Maroua', value: 'Maroua' },
  { label: 'Ngaoundéré', value: 'Ngaoundéré' },
  { label: 'Bertoua', value: 'Bertoua' },
  { label: 'Limbe', value: 'Limbe' },
  { label: 'Buea', value: 'Buea' },
];

const QUICK_FILTERS = [
  { label: 'Tonight', value: 'tonight' },
  { label: 'Free Events', value: 'free' },
  { label: 'This Weekend', value: 'weekend' },
  { label: 'Music', value: 'music' },
];

const HomePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);
  const currentView = useSelector(selectView);
  const cityDropdownRef = useRef(null);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuickFilter, setActiveQuickFilter] = useState('');
  const [showFilterSidebar, setShowFilterSidebar] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] = useState({
    category: '',
    city: '',
    dateFrom: '',
    dateTo: '',
    dateFilter: '',
    isFree: '',
    priceMin: '',
    priceMax: '',
    priceFilter: '',
  });

  const fetchEvents = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 12,
      };

      if (filters.category) params.category = filters.category;
      if (filters.city) params.city = filters.city;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      if (filters.isFree === 'true') params.isFree = 'true';
      if (filters.priceMin) params.priceMin = filters.priceMin;
      if (filters.priceMax) params.priceMax = filters.priceMax;

      const response = await eventsAPI.getAll(params);

      if (response.data.success) {
        setEvents(response.data.data.events);
        setTotalPages(response.data.data.pagination.totalPages);
        setCurrentPage(response.data.data.pagination.currentPage);
      }
    } catch (error) {
      console.error('Fetch events error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target)) {
        setShowCityDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQuickFilter = (filterValue) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let newFilters = { ...filters };

    if (activeQuickFilter === filterValue) {
      setActiveQuickFilter('');
      newFilters = {
        category: '',
        city: '',
        dateFrom: '',
        dateTo: '',
        dateFilter: '',
        isFree: '',
        priceMin: '',
        priceMax: '',
        priceFilter: '',
      };
    } else {
      setActiveQuickFilter(filterValue);

      switch (filterValue) {
        case 'tonight':
          newFilters.dateFrom = today.toISOString().split('T')[0];
          newFilters.dateTo = today.toISOString().split('T')[0];
          newFilters.dateFilter = 'today';
          break;
        case 'free':
          newFilters.isFree = 'true';
          newFilters.priceFilter = 'free';
          break;
        case 'weekend': {
          const dayOfWeek = today.getDay();
          const daysUntilSaturday = (6 - dayOfWeek + 7) % 7;
          const saturday = new Date(today);
          saturday.setDate(today.getDate() + daysUntilSaturday);
          const sunday = new Date(saturday);
          sunday.setDate(saturday.getDate() + 1);
          newFilters.dateFrom = saturday.toISOString().split('T')[0];
          newFilters.dateTo = sunday.toISOString().split('T')[0];
          newFilters.dateFilter = 'weekend';
          break;
        }
        case 'music':
          newFilters.category = 'Music & Concerts';
          break;
        default:
          break;
      }
    }

    setFilters(newFilters);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setActiveQuickFilter('');
  };

  const handleClearFilters = () => {
    setFilters({
      category: '',
      city: '',
      dateFrom: '',
      dateTo: '',
      dateFilter: '',
      isFree: '',
      priceMin: '',
      priceMax: '',
      priceFilter: '',
    });
    setActiveQuickFilter('');
  };

  const handleLoadMore = () => {
    if (currentPage < totalPages) {
      fetchEvents(currentPage + 1);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="pt-20">
      <section className="relative bg-dark-amaranth overflow-hidden py-16 md:py-20">
        <div
          className="absolute inset-0 opacity-[0.075] pointer-events-none"
          style={{
            backgroundImage: 'url(/patterns/toghu-pattern.svg)',
            backgroundSize: '100px',
          }}
        />

        <Container className="relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-white mb-4">
              Discover Events in <span className="text-lime-cream">Cameroon</span>
            </h1>
            <p className="font-body text-base md:text-lg text-white/90 mb-8">
              Find concerts, festivals, workshops, and more happening near you
            </p>

            <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
              <div className="bg-white/95 backdrop-blur-sm rounded-md shadow-lg border border-gray-200 p-2 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search events"
                    className="w-full pl-12 pr-4 py-2.5 font-body text-base bg-transparent focus:outline-none text-gray-700 placeholder:text-gray-400"
                  />
                </div>
                <Button type="submit" variant="primary" size="md" className="rounded-full px-8">
                  <Search className="w-5 h-5" />
                </Button>
              </div>
            </form>
          </div>
        </Container>
      </section>

      <section className="py-6 border-b border-gray-200">
        <Container>
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {QUICK_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => handleQuickFilter(filter.value)}
                className={`px-4 py-2 rounded-full font-body text-sm font-semibold whitespace-nowrap transition-all ${activeQuickFilter === filter.value
                  ? 'bg-teal text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-teal hover:text-teal'
                  }`}
              >
                {filter.label}
              </button>
            ))}
            <button
              onClick={() => setShowFilterSidebar(!showFilterSidebar)}
              className="ml-auto px-4 py-2 rounded-full font-body text-sm font-semibold whitespace-nowrap border border-gray-200 text-gray-700 hover:border-teal hover:text-teal transition-all flex items-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>
          </div>
        </Container>
      </section>

      {currentView === 'list' ? (
        <Container className="py-12">
          <div className="flex gap-8">
            {showFilterSidebar && (
              <div className="hidden lg:block w-80 flex-shrink-0">
                <div className="sticky top-24">
                  <FilterSidebar
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onClearFilters={handleClearFilters}
                  />
                </div>
              </div>
            )}

            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-2xl font-bold text-ink-black">
                  {isAuthenticated
                    ? `Events for ${currentUser?.name?.split(' ')[0]}`
                    : 'Upcoming Events'}
                </h2>
                {(filters.category ||
                  filters.city ||
                  filters.dateFilter ||
                  filters.priceFilter) && (
                    <button
                      onClick={handleClearFilters}
                      className="font-body text-sm text-teal font-semibold hover:underline flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Clear Filters
                    </button>
                  )}
              </div>

              <EventGrid events={events} loading={loading} />

              {!loading && events.length > 0 && currentPage < totalPages && (
                <div className="mt-12 text-center">
                  <Button variant="secondary" size="lg" onClick={handleLoadMore}>
                    Load More Events
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Container>
      ) : (
        <MapViewPage filters={filters} events={events} />
      )}

      {showFilterSidebar && (
        <div
          className="lg:hidden fixed inset-0 bg-ink-black/70 z-50 animate-fade-in"
          onClick={() => setShowFilterSidebar(false)}
        >
          <div
            className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-bright-snow p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <FilterSidebar
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              isMobile
              onClose={() => setShowFilterSidebar(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
