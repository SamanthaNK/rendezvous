import React, { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = process.env.VITE_MAPBOX_TOKEN || '';

const YAOUNDE_COORDS = [11.5181, 3.848]; // [lng, lat]

const MapViewPage = () => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapContainer.current) return;
    if (mapRef.current) return;
    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: YAOUNDE_COORDS,
      zoom: 11,
    });
    // ...event marker logic will go here
    return () => {
      mapRef.current?.remove();
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default MapViewPage;
