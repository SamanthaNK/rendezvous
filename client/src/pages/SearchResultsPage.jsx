import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Search, AlertCircle, SlidersHorizontal, X } from 'lucide-react';
import { searchAPI } from '../services/api';
import { addToHistory, setLoading, setError } from '../store/searchSlice';
import Container from '../layouts/Container';
import EventGrid from '../components/event/EventGrid';
import FilterSidebar from '../components/event/FilterSidebar';
import ParsedParameters from '../components/search/ParsedParameters';
import Button from '../components/common/Button';

const SearchResultsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [events, setEvents] = useState([]);
    const [parsedQuery, setParsedQuery] = useState(null);
    const [usedFallback, setUsedFallback] = useState(false);
    const [loading, setLoadingState] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showFilterSidebar, setShowFilterSidebar] = useState(false);
    const [searchValue, setSearchValue] = useState('');

    const query = searchParams.get('q') || '';

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

    useEffect(() => {
        setSearchValue(query);
        if (query) {
            performSearch(query, 1);
        }
    }, [query]);

    const performSearch = async (searchQuery, page = 1) => {
        try {
            setLoadingState(true);
            dispatch(setLoading(true));
            dispatch(setError(null));

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

            const response = await searchAPI.search(searchQuery, params);

            if (response.data.success) {
                setEvents(response.data.data.events);
                setParsedQuery(response.data.data.parsedQuery);
                setUsedFallback(response.data.data.usedFallback);
                setTotalPages(response.data.data.pagination.totalPages);
                setCurrentPage(response.data.data.pagination.currentPage);

                dispatch(addToHistory(searchQuery));
            }
        } catch (error) {
            console.error('Search error:', error);
            dispatch(setError(error.message));
        } finally {
            setLoadingState(false);
            dispatch(setLoading(false));
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchValue.trim()) {
            setSearchParams({ q: searchValue });
        }
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        if (query) {
            performSearch(query, 1);
        }
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
        if (query) {
            performSearch(query, 1);
        }
    };

    const handleLoadMore = () => {
        if (currentPage < totalPages && query) {
            performSearch(query, currentPage + 1);
        }
    };

    if (!query) {
        return (
            <div className="min-h-screen pt-20 bg-bright-snow">
                <Container className="py-20 text-center">
                    <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h1 className="font-heading text-3xl font-bold text-ink-black mb-4">
                        Search Events
                    </h1>
                    <p className="font-body text-base text-gray-600 mb-8">
                        Enter a search query to find events
                    </p>
                    <Button variant="primary" size="lg" onClick={() => navigate('/')}>
                        Go to Homepage
                    </Button>
                </Container>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-20 bg-bright-snow">
            <div className="py-6 border-b border-gray-200 bg-white">
                <Container>
                    <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                placeholder="Search events..."
                                className="w-full pl-12 pr-4 py-3 font-body text-base border-[1.5px] border-gray-200 rounded-md focus:outline-none focus:border-teal focus:ring-4 focus:ring-teal/10 transition-all"
                            />
                        </div>
                    </form>
                </Container>
            </div>

            {usedFallback && !loading && (
                <div className="py-4 bg-warning/10 border-b border-warning/20">
                    <Container>
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-body text-sm text-gray-700">
                                    AI search is temporarily unavailable. Showing results using keyword search instead.
                                </p>
                            </div>
                        </div>
                    </Container>
                </div>
            )}

            {parsedQuery && !loading && (
                <div className="py-6 border-b border-gray-200">
                    <Container>
                        <ParsedParameters parsedQuery={parsedQuery} originalQuery={query} />
                    </Container>
                </div>
            )}

            <section className="py-6 border-b border-gray-200">
                <Container>
                    <div className="flex items-center justify-between">
                        <h2 className="font-heading text-xl font-bold text-ink-black">
                            {loading ? 'Searching...' : `${events.length} results for "${query}"`}
                        </h2>
                        <button
                            onClick={() => setShowFilterSidebar(!showFilterSidebar)}
                            className="px-4 py-2 rounded-md font-body text-sm font-semibold border border-gray-200 text-gray-700 hover:border-teal hover:text-teal transition-all flex items-center gap-2"
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            Filters
                        </button>
                    </div>
                </Container>
            </section>

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
                        {(filters.category ||
                            filters.city ||
                            filters.dateFilter ||
                            filters.priceFilter) && (
                                <div className="mb-6 flex items-center justify-between">
                                    <p className="font-body text-sm text-gray-600">
                                        Active filters applied
                                    </p>
                                    <button
                                        onClick={handleClearFilters}
                                        className="font-body text-sm text-teal font-semibold hover:underline flex items-center gap-2"
                                    >
                                        <X className="w-4 h-4" />
                                        Clear Filters
                                    </button>
                                </div>
                            )}

                        {!loading && events.length === 0 ? (
                            <div className="text-center py-16">
                                <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="font-heading text-2xl font-bold text-ink-black mb-2">
                                    No Events Found
                                </h3>
                                <p className="font-body text-base text-gray-600 mb-6">
                                    Try adjusting your search query or filters
                                </p>
                                <Button variant="secondary" size="lg" onClick={() => navigate('/')}>
                                    Browse All Events
                                </Button>
                            </div>
                        ) : (
                            <>
                                <EventGrid events={events} loading={loading} />

                                {!loading && events.length > 0 && currentPage < totalPages && (
                                    <div className="mt-12 text-center">
                                        <Button variant="secondary" size="lg" onClick={handleLoadMore}>
                                            Load More Results
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </Container>

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

export default SearchResultsPage;