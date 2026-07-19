import React, { useEffect, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';

const API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface MapComponentProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}

function MapInteraction({ onLocationSelect, initialLat, initialLng }: MapComponentProps) {
  const map = useMap();
  const [position, setPosition] = useState<{lat: number, lng: number} | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );

  useEffect(() => {
    if (!map) return;
    map.addListener('click', (e: google.maps.MapMouseEvent) => {
      const lat = e.latLng?.lat();
      const lng = e.latLng?.lng();
      if (lat && lng) {
        setPosition({ lat, lng });
        onLocationSelect(lat, lng);
      }
    });
  }, [map, onLocationSelect]);

  return position ? (
    <AdvancedMarker position={position}>
      <Pin background="#FF5A1F" glyphColor="#fff" />
    </AdvancedMarker>
  ) : null;
}

export default function MapComponent({ onLocationSelect, initialLat, initialLng }: MapComponentProps) {
  const [currentPos, setCurrentPos] = useState<{lat: number, lng: number} | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );

  useEffect(() => {
    if (!initialLat || !initialLng) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCurrentPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error("Error detecting location", err)
      );
    }
  }, []);

  if (!hasValidKey) {
    return (
      <div className="flex items-center justify-center h-48 bg-charcoal border border-cream/20 text-cream p-4 text-center">
        <p>Google Maps API Key required. Please follow setup instructions in settings.</p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY} version="weekly">
      <Map
        defaultCenter={currentPos || { lat: 23.8103, lng: 90.3562 }}
        defaultZoom={15}
        mapId="DEMO_MAP_ID"
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        style={{ width: '100%', height: '300px' }}
      >
        <MapInteraction onLocationSelect={onLocationSelect} initialLat={initialLat} initialLng={initialLng} />
      </Map>
    </APIProvider>
  );
}
