'use client';

import { useState, useEffect, useRef } from 'react';
import { Technician, ScheduledJob } from '@/types';
import Map, { Marker, Popup, NavigationControl, GeolocateControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapViewProps {
  technicians: Technician[];
  jobs: ScheduledJob[];
  center?: [number, number];
  zoom?: number;
  onTechnicianClick?: (technician: Technician) => void;
  onJobClick?: (job: ScheduledJob) => void;
  showRoutes?: boolean;
}

export default function MapView({
  technicians,
  jobs,
  center = [-74.006, 40.7128], // Default to NYC
  zoom = 11,
  onTechnicianClick,
  onJobClick,
  showRoutes = false,
}: MapViewProps) {
  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);
  const [selectedJob, setSelectedJob] = useState<ScheduledJob | null>(null);
  const [viewState, setViewState] = useState({
    longitude: center[0],
    latitude: center[1],
    zoom: zoom,
  });

  // Check if Mapbox token is available
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  if (!mapboxToken) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-50 rounded-lg">
        <div className="text-center p-8">
          <p className="text-red-600 font-semibold mb-2">Mapbox Token Missing</p>
          <p className="text-sm text-gray-600">Add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to .env.local</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={mapboxToken}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-right" />
        <GeolocateControl position="top-right" />

        {/* Technician Markers */}
        {technicians.map(tech => (
          <Marker
            key={tech.id}
            longitude={tech.location.lng}
            latitude={tech.location.lat}
            anchor="bottom"
          >
            <div
              onClick={() => {
                setSelectedTechnician(tech);
                onTechnicianClick?.(tech);
              }}
              className="cursor-pointer transform hover:scale-110 transition-transform"
            >
              <div className="relative">
                <div
                  className="w-10 h-10 rounded-full border-4 border-white shadow-lg flex items-center justify-center"
                  style={{ backgroundColor: tech.color }}
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
              </div>
            </div>
          </Marker>
        ))}

        {/* Job Markers */}
        {jobs.map(job => {
          // Parse location to get coordinates (you'd need actual geocoding)
          const jobLat = 40.7128 + (Math.random() - 0.5) * 0.1;
          const jobLng = -74.006 + (Math.random() - 0.5) * 0.1;

          return (
            <Marker
              key={job.id}
              longitude={jobLng}
              latitude={jobLat}
              anchor="bottom"
            >
              <div
                onClick={() => {
                  setSelectedJob(job);
                  onJobClick?.(job);
                }}
                className="cursor-pointer transform hover:scale-110 transition-transform"
              >
                <div
                  className={`w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center ${
                    job.isEmergency ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </Marker>
          );
        })}

        {/* Technician Popup */}
        {selectedTechnician && (
          <Popup
            longitude={selectedTechnician.location.lng}
            latitude={selectedTechnician.location.lat}
            anchor="top"
            onClose={() => setSelectedTechnician(null)}
            closeButton={true}
            closeOnClick={false}
          >
            <div className="p-2">
              <h3 className="font-semibold text-lg mb-1">{selectedTechnician.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{selectedTechnician.location.address}</p>
              <div className="space-y-1">
                <p className="text-xs"><strong>Phone:</strong> {selectedTechnician.phone}</p>
                <p className="text-xs"><strong>Skills:</strong> {selectedTechnician.skills.join(', ')}</p>
              </div>
            </div>
          </Popup>
        )}

        {/* Job Popup */}
        {selectedJob && (
          <Popup
            longitude={-74.006}
            latitude={40.7128}
            anchor="top"
            onClose={() => setSelectedJob(null)}
            closeButton={true}
            closeOnClick={false}
          >
            <div className="p-2">
              <h3 className="font-semibold text-lg mb-1">{selectedJob.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{selectedJob.location}</p>
              <div className="space-y-1">
                <p className="text-xs"><strong>Status:</strong> {selectedJob.dispatchStatus}</p>
                <p className="text-xs"><strong>Priority:</strong> {selectedJob.priority}</p>
                {selectedJob.isEmergency && (
                  <p className="text-xs text-red-600 font-semibold">⚠️ EMERGENCY</p>
                )}
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
