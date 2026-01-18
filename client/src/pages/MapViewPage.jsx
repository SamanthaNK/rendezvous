import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import PropTypes from 'prop-types';
import { mapAPI } from '../services/api';
import { X, MapPin as MapPinIcon } from 'lucide-react';
import Spinner from '../components/common/Spinner';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const YAOUNDE_COORDS = [3.848, 11.5021];

// Category colors from design system
const CATEGORY_COLORS = {
  'Music & Concerts': '#028090',
  'Arts & Culture': '#63132b',
  'Sports & Fitness': '#10b981',
  'Food & Drink': '#f59e0b',
  'Business & Networking': '#3b82f6',
  'Technology': '#028090',
  'Health & Wellness': '#10b981',
  'Community & Charity': '#bde585',
  'Entertainment': '#63132b',
  'Education & Workshops': '#3b82f6',
  'Family & Kids': '#bde585',
  'Nightlife': '#63132b',
};

const createCustomIcon = (category) => {
  const color = CATEGORY_COLORS[category] || '#028090';
  const svgIcon = `
    <svg width="32" height="42" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0c-8.837 0-16 7.163-16 16 0 12 16 26 16 26s16-14 16-26c0-8.837-7.163-16-16-16z" fill="${color}"/>
      <circle cx="16" cy="16" r="6" fill="white"/>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: 'custom-marker',
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42],
  });
};

// Component to handle map bounds changes
const MapBoundsHandler = ({ onBoundsChange }) => {
  const map = useMap();
  const hasInitialized = useRef(false);

  useEffect(() => {
    const handleMoveEnd = () => {
      const bounds = map.getBounds();
      onBoundsChange(bounds);
    };

    // Only trigger initial load once
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      handleMoveEnd();
    }

    map.on('moveend', handleMoveEnd);

    return () => {
      map.off('moveend', handleMoveEnd);
    };
  }, [map]);

  return null;
};

MapBoundsHandler.propTypes = {
  onBoundsChange: PropTypes.func.isRequired,
};

// User location marker component
const UserLocationMarker = () => {
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition([pos.coords.latitude, pos.coords.longitude]);
        },
        (error) => {
          console.log('Location access denied:', error);
        }
      );
    }
  }, []);

  if (!position) return null;

  const userIcon = L.divIcon({
    html: `
      <div style="
        width: 16px;
        height: 16px;
        background: #028090;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>
    `,
    className: 'user-location-marker',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

  return (
    <Marker position={position} icon={userIcon}>
      <Popup>
        <div style={{ fontFamily: 'Manrope, sans-serif', padding: '4px' }}>
          <strong>Your Location</strong>
        </div>
      </Popup>
    </Marker>
  );
};

// Filter controls
const MapFilters = ({ filters, onFilterChange, onClose }) => {
  const CATEGORIES = [
    'Music & Concerts',
    'Arts & Culture',
    'Sports & Fitness',
    'Food & Drink',
    'Business & Networking',
    'Technology',
    'Health & Wellness',
    'Community & Charity',
    'Entertainment',
    'Education & Workshops',
    'Family & Kids',
    'Nightlife',
  ];

  return (
    <div className="absolute top-4 right-4 z-[1000] bg-white rounded-xl border border-gray-200 shadow-lg p-4 w-80 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-lg font-bold text-ink-black">Map Filters</h3>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block font-body text-sm font-medium text-ink-black mb-2">
            Category
          </label>
          <select
            value={filters.category}
            onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-md font-body text-sm focus:outline-none focus:border-teal"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-body text-sm font-medium text-ink-black mb-2">
            Date From
          </label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onFilterChange({ ...filters, dateFrom: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-md font-body text-sm focus:outline-none focus:border-teal"
          />
        </div>

        <div>
          <label className="block font-body text-sm font-medium text-ink-black mb-2">
            Date To
          </label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => onFilterChange({ ...filters, dateTo: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-md font-body text-sm focus:outline-none focus:border-teal"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.isFree === 'true'}
              onChange={(e) =>
                onFilterChange({ ...filters, isFree: e.target.checked ? 'true' : '' })
              }
              className="w-4 h-4 rounded border-2 border-gray-300 text-teal focus:ring-2 focus:ring-teal/20"
            />
            <span className="font-body text-sm text-ink-black">Free Events Only</span>
          </label>
        </div>

        {filters.isFree !== 'true' && (
          <div>
            <label className="block font-body text-sm font-medium text-ink-black mb-2">
              Max Price (FCFA)
            </label>
            <input
              type="number"
              value={filters.priceMax}
              onChange={(e) => onFilterChange({ ...filters, priceMax: e.target.value })}
              placeholder="e.g., 5000"
              className="w-full px-3 py-2 border border-gray-200 rounded-md font-body text-sm focus:outline-none focus:border-teal"
            />
          </div>
        )}

        <button
          onClick={() =>
            onFilterChange({
              category: '',
              dateFrom: '',
              dateTo: '',
              isFree: '',
              priceMax: '',
            })
          }
          className="w-full px-4 py-2 border border-gray-200 rounded-md font-body text-sm font-semibold text-gray-700 hover:border-teal hover:text-teal transition-colors"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
};

MapFilters.propTypes = {
  filters: PropTypes.object.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

const MapViewPage = ({ filters: initialFilters }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [mapFilters, setMapFilters] = useState({
    category: initialFilters?.category || '',
    dateFrom: initialFilters?.dateFrom || '',
    dateTo: initialFilters?.dateTo || '',
    isFree: initialFilters?.isFree || '',
    priceMax: initialFilters?.priceMax || '',
  });
  const boundsRef = useRef(null);

  const fetchMapEvents = useCallback(async (bounds) => {
    if (!bounds) return;

    try {
      setLoading(true);
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();

      const params = {
        swLng: sw.lng,
        swLat: sw.lat,
        neLng: ne.lng,
        neLat: ne.lat,
      };

      if (mapFilters.category) params.category = mapFilters.category;
      if (mapFilters.dateFrom) params.dateFrom = mapFilters.dateFrom;
      if (mapFilters.dateTo) params.dateTo = mapFilters.dateTo;
      if (mapFilters.isFree === 'true') params.isFree = 'true';
      if (mapFilters.priceMax) params.priceMax = mapFilters.priceMax;

      const response = await mapAPI.getEventsInBounds(params);

      if (response.data.success) {
        setEvents(response.data.data.events);
      }
    } catch (error) {
      console.error('Fetch map events error:', error);
    } finally {
      setLoading(false);
    }
  }, [mapFilters]);

  const handleBoundsChange = (bounds) => {
    boundsRef.current = bounds;
    fetchMapEvents(bounds);
  };

  const handleFilterChange = (newFilters) => {
    setMapFilters(newFilters);
  };

  useEffect(() => {
    if (boundsRef.current) {
      fetchMapEvents(boundsRef.current);
    }
  }, [mapFilters]);

  const validEvents = events.filter((event) => {
    const coords = event.location?.coordinates?.coordinates;
    if (!coords || coords.length !== 2) return false;
    const [lng, lat] = coords;
    if (lng === 0 && lat === 0) return false;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
    return true;
  });

  return (
    <div className="relative w-full" style={{ height: 'calc(100vh - 200px)' }}>
      {loading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <Spinner size="sm" />
          <span className="font-body text-sm text-gray-700">Loading events...</span>
        </div>
      )}

      <button
        onClick={() => setShowFilters(!showFilters)}
        className="absolute top-4 left-4 z-[1000] px-4 py-2 bg-white border border-gray-200 rounded-md font-body text-sm font-semibold text-gray-700 hover:border-teal hover:text-teal transition-colors shadow-lg flex items-center gap-2"
      >
        <MapPinIcon className="w-4 h-4" />
        Filters {Object.values(mapFilters).some((v) => v) && '(Active)'}
      </button>

      {showFilters && (
        <MapFilters
          filters={mapFilters}
          onFilterChange={handleFilterChange}
          onClose={() => setShowFilters(false)}
        />
      )}

      {validEvents.length === 0 && !loading ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <MapPinIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="font-heading text-xl font-semibold text-ink-black mb-2">
              No Events in This Area
            </p>
            <p className="font-body text-base text-gray-600">
              Try zooming out or adjusting your filters
            </p>
          </div>
        </div>
      ) : (
        <MapContainer
          center={YAOUNDE_COORDS}
          zoom={11}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          <MapBoundsHandler onBoundsChange={handleBoundsChange} />
          <UserLocationMarker />

          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={50}
            spiderfyOnMaxZoom={true}
            showCoverageOnHover={false}
          >
            {validEvents.map((event) => {
              const [lng, lat] = event.location.coordinates.coordinates;
              const category = event.categories?.[0] || 'Entertainment';

              return (
                <Marker
                  key={event._id}
                  position={[lat, lng]}
                  icon={createCustomIcon(category)}
                >
                  <Popup maxWidth={250}>
                    <div style={{ fontFamily: 'Manrope, sans-serif', minWidth: '200px' }}>
                      <div style={{ marginBottom: '8px' }}>
                        {event.images?.[0] && (
                          <img
                            src={event.images[0]}
                            alt={event.title}
                            style={{
                              width: '100%',
                              height: '120px',
                              objectFit: 'cover',
                              borderRadius: '6px',
                              marginBottom: '8px',
                            }}
                          />
                        )}
                      </div>
                      <div
                        style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          backgroundColor: `${CATEGORY_COLORS[category]}15`,
                          color: CATEGORY_COLORS[category],
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '600',
                          marginBottom: '8px',
                        }}
                      >
                        {category}
                      </div>
                      <h3
                        style={{
                          fontFamily: 'Geologica, sans-serif',
                          fontWeight: 600,
                          fontSize: '14px',
                          marginBottom: '6px',
                          color: '#0b2027',
                          lineHeight: '1.3',
                        }}
                      >
                        {event.title}
                      </h3>
                      <p
                        style={{
                          fontSize: '12px',
                          color: '#4b5563',
                          margin: '0 0 4px 0',
                        }}
                      >
                        {event.location.city}
                      </p>
                      <p
                        style={{
                          fontSize: '12px',
                          color: '#028090',
                          fontWeight: 600,
                          margin: '0 0 12px 0',
                        }}
                      >
                        {event.isFree ? 'Free' : `${event.price} FCFA`}
                      </p>
                      <a
                        href={`/events/${event._id}`}
                        style={{
                          display: 'inline-block',
                          padding: '6px 12px',
                          backgroundColor: '#028090',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          textDecoration: 'none',
                          fontWeight: '600',
                        }}
                      >
                        View Event
                      </a>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MarkerClusterGroup>
        </MapContainer>
      )}

      <div className="absolute bottom-4 left-4 z-[1000] bg-white px-4 py-2 rounded-full shadow-lg">
        <p className="font-body text-sm text-gray-700">
          <strong>{validEvents.length}</strong> events shown
        </p>
      </div>
    </div>
  );
};

MapViewPage.propTypes = {
  filters: PropTypes.object,
};

export default MapViewPage;