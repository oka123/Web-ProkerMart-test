"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix leaflet marker icon issue in Next.js
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface Location {
  lat: number;
  lng: number;
}

interface MapAreaProps {
  userLocation: Location;
  shops: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
  }>;
  onMarkerClick?: (id: string) => void;
  activeShopId?: string | null;
}

export default function MapArea({
  userLocation,
  shops,
  onMarkerClick,
  activeShopId,
}: MapAreaProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Initialize Leaflet map manually to have full control over lifecycle
    const map = L.map(mapContainerRef.current, {
      center: [userLocation.lat, userLocation.lng],
      zoom: 16,
      zoomControl: true,
    });

    mapInstanceRef.current = map;

    // Google Maps tile layer
    L.tileLayer("https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}").addTo(
      map,
    );

    // We will handle user location and shop markers in a separate useEffect
    // to support dynamic updates.
    
    // CRITICAL: Call map.remove() on cleanup — this properly releases the
    // container so HMR remounts never hit "Map container is being reused".
    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount only

  // Update markers when shops or userLocation change
  const userMarkerRef = useRef<L.Marker | null>(null);
  
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Clear old markers
    if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
    Object.values(markersRef.current).forEach((marker) => map.removeLayer(marker));
    markersRef.current = {};

    // Add user location marker
    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: customIcon })
      .addTo(map)
      .bindPopup("Lokasi Anda");

    // Add shop markers
    shops.forEach((shop) => {
      const marker = L.marker([shop.lat, shop.lng], { icon: customIcon })
        .addTo(map)
        .bindPopup(shop.name);
      
      markersRef.current[shop.id] = marker;

      if (onMarkerClick) {
        marker.on("click", () => onMarkerClick(shop.id));
      }
    });
  }, [shops, userLocation.lat, userLocation.lng, onMarkerClick]);

  // Update view when userLocation changes after mount
  useEffect(() => {
    if (mapInstanceRef.current && !activeShopId) {
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lng]);
    }
  }, [userLocation.lat, userLocation.lng, activeShopId]);

  // Handle activeShopId changes
  useEffect(() => {
    if (mapInstanceRef.current && activeShopId) {
      const activeShop = shops.find((s) => s.id === activeShopId);
      if (activeShop) {
        // Fly to the active shop
        mapInstanceRef.current.flyTo([activeShop.lat, activeShop.lng], 16, {
          animate: true,
          duration: 0.8,
        });

        // Open popup for the active shop
        const marker = markersRef.current[activeShopId];
        if (marker) {
          marker.openPopup();
        }
      }
    }
  }, [activeShopId, shops]);

  return (
    <div
      ref={mapContainerRef}
      style={{ height: "100%", width: "100%", zIndex: 0 }}
    />
  );
}
