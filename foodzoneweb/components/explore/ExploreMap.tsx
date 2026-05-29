"use client";

import { useExploreMap } from "@/lib/hooks/use-explore";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef } from "react";

// Lucide icon as data-uri so Leaflet markers stay style-consistent (avoids the default
// 404 marker assets shipped from leaflet/dist/images).
const PIN_SVG = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='#ef4444' stroke='#fff' stroke-width='2'>
    <path d='M12 22s8-7.6 8-13a8 8 0 1 0-16 0c0 5.4 8 13 8 13z'/>
    <circle cx='12' cy='9' r='3' fill='#fff'/>
  </svg>`,
);

const PIN_ICON = L.icon({
  iconUrl: `data:image/svg+xml;charset=UTF-8,${PIN_SVG}`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -24],
});

export function ExploreMap() {
  const { data, isLoading } = useExploreMap();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  const center = useMemo<[number, number]>(() => {
    if (data && data.length > 0) return [data[0].lat, data[0].lng];
    return [12.97, 77.59]; // sensible default (Bengaluru)
  }, [data]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current, {
      center,
      zoom: 11,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 18,
    }).addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [center]);

  useEffect(() => {
    if (!mapRef.current || !data) return;

    const map = mapRef.current;
    const markers: L.Marker[] = [];

    for (const v of data) {
      const marker = L.marker([v.lat, v.lng], { icon: PIN_ICON })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:system-ui">
             <strong>${v.name}</strong><br/>
             <span>${v.rating_avg > 0 ? `★ ${v.rating_avg.toFixed(1)}` : "New"}</span>
             ${v.is_open ? "" : '<span style="color:#dc2626"> · Closed</span>'}
             <br/><a href="/vendors/${v.slug}" style="color:#ef4444">Open store →</a>
           </div>`,
        );
      markers.push(marker);
    }

    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.2));
    }

    return () => {
      for (const m of markers) m.remove();
    };
  }, [data]);

  return (
    <div className="relative h-[480px] w-full overflow-hidden rounded-card border border-line">
      <div ref={containerRef} className="h-full w-full" />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg/60 text-sm text-muted">
          Loading map…
        </div>
      )}
      {!isLoading && data && data.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-muted">
          No vendors with coordinates yet.
        </div>
      )}
    </div>
  );
}
