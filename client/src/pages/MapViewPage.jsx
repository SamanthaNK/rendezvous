import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import PropTypes from 'prop-types';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Default center: Yaounde, Cameroon
const YAOUNDE_COORDS = [3.848, 11.5021];

const isValidCoordinate = (coords) => {
  if (!coords || coords.length !== 2) return false;
  const [lng, lat] = coords;

  if (lng === 0 && lat === 0) return false;

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;

  return true;
};

const MapViewPage = ({ events }) => {
  const validEvents = events.filter(event => {
    const coords = event.location?.coordinates?.coordinates;
    return isValidCoordinate(coords);
  });

  if (validEvents.length === 0) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <p className="font-heading text-xl font-semibold text-ink-black mb-2">
            No Events with Valid Locations
          </p>
          <p className="font-body text-base text-gray-600">
            The events in your current filter don't have map coordinates yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <MapContainer
        center={YAOUNDE_COORDS}
        zoom={11}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {validEvents.map((event) => {
          const [lng, lat] = event.location.coordinates.coordinates;

          return (
            <Marker key={event._id} position={[lat, lng]}>
              <Popup>
                <div style={{ fontFamily: 'Manrope, sans-serif', minWidth: '200px' }}>
                  <h3 style={{
                    fontFamily: 'Geologica, sans-serif',
                    fontWeight: 600,
                    fontSize: '14px',
                    marginBottom: '4px',
                    color: '#0b2027'
                  }}>
                    {event.title}
                  </h3>
                  <p style={{
                    fontSize: '12px',
                    color: '#4b5563',
                    margin: '0 0 4px 0'
                  }}>
                    {event.location.city}
                  </p>
                  <p style={{
                    fontSize: '12px',
                    color: '#028090',
                    fontWeight: 600,
                    margin: 0
                  }}>
                    {event.isFree ? 'Free' : `${event.price} FCFA`}
                  </p>
                  <a
                    href={`/events/${event._id}`}
                    style={{
                      display: 'inline-block',
                      marginTop: '8px',
                      padding: '4px 8px',
                      backgroundColor: '#028090',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      textDecoration: 'none'
                    }}
                  >
                    View Event
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

MapViewPage.propTypes = {
  events: PropTypes.arrayOf(PropTypes.object),
};

export default MapViewPage;