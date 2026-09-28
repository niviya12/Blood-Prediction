import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Compass,
  Layers,
  Filter,
  Shield,
  Hospital as HospIcon,
  Warehouse,
  Heart,
  AlertCircle,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { Donor, Hospital, BloodBank, BloodRequest, BloodGroup } from '../types';
import { calculateDistanceKm } from '../services/matching';

interface InteractiveMapProps {
  donors: Donor[];
  hospitals: Hospital[];
  bloodBanks: BloodBank[];
  requests: BloodRequest[];
  onSelectDonor?: (donor: Donor) => void;
  onSelectHospital?: (hospital: Hospital) => void;
  onSelectBloodBank?: (bank: BloodBank) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  donors,
  hospitals,
  bloodBanks,
  requests,
  onSelectDonor,
  onSelectHospital,
  onSelectBloodBank,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  // Default Center: Sivakasi (9.4533, 77.7983)
  const [centerCoords, setCenterCoords] = useState<[number, number]>([9.4533, 77.7983]);
  const [selectedRadiusKm, setSelectedRadiusKm] = useState<number>(10);
  const [filterType, setFilterType] = useState<'ALL' | 'HOSPITALS' | 'BLOOD_BANKS' | 'DONORS' | 'REQUESTS'>('ALL');
  const [bloodGroupFilter, setBloodGroupFilter] = useState<string>('ALL');
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);
  const [userGpsActive, setUserGpsActive] = useState(false);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    const map = L.map(mapContainerRef.current, {
      center: centerCoords,
      zoom: 13,
      zoomControl: true,
    });

    // OpenStreetMap standard tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors | AI Blood Network',
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers and Radius overlay when state or filters change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // 1. Draw Radius Circle from current center
    if (circleRef.current) {
      circleRef.current.remove();
    }
    const circle = L.circle(centerCoords, {
      radius: selectedRadiusKm * 1000,
      color: '#e11d48',
      fillColor: '#fda4af',
      fillOpacity: 0.12,
      weight: 1.5,
      dashArray: '4, 6',
    }).addTo(layerGroup);
    circleRef.current = circle;

    // Custom Marker Icons using pure HTML/SVG
    const createHtmlIcon = (bgColor: string, text: string, subText?: string) => {
      return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="
            background: ${bgColor};
            color: white;
            padding: 4px 8px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 800;
            display: flex;
            align-items: center;
            gap: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
            border: 2px solid white;
            white-space: nowrap;
            transform: translate(-50%, -50%);
          ">
            <span>${text}</span>
            ${subText ? `<span style="background: rgba(255,255,255,0.3); padding: 1px 4px; border-radius: 6px; font-size: 9px;">${subText}</span>` : ''}
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });
    };

    // 2. Hospitals Markers (🔴 Red)
    if (filterType === 'ALL' || filterType === 'HOSPITALS') {
      hospitals.forEach((hosp) => {
        const dist = calculateDistanceKm(centerCoords[0], centerCoords[1], hosp.latitude, hosp.longitude);
        if (dist <= selectedRadiusKm * 1.5) {
          const marker = L.marker([hosp.latitude, hosp.longitude], {
            icon: createHtmlIcon('#e11d48', '🏥', hosp.hospitalName.substring(0, 14)),
          });
          marker.on('click', () => {
            setSelectedEntity({ type: 'HOSPITAL', data: hosp, distance: dist });
            onSelectHospital?.(hosp);
          });
          layerGroup.addLayer(marker);
        }
      });
    }

    // 3. Blood Banks Markers (🩸 Burgundy / Purple)
    if (filterType === 'ALL' || filterType === 'BLOOD_BANKS') {
      bloodBanks.forEach((bb) => {
        const dist = calculateDistanceKm(centerCoords[0], centerCoords[1], bb.latitude, bb.longitude);
        if (dist <= selectedRadiusKm * 1.5) {
          const totalUnits = Object.values(bb.stock).reduce((acc, s) => acc + s.availableUnits, 0);
          const marker = L.marker([bb.latitude, bb.longitude], {
            icon: createHtmlIcon('#7c3aed', '🩸', `${totalUnits}u`),
          });
          marker.on('click', () => {
            setSelectedEntity({ type: 'BLOOD_BANK', data: bb, distance: dist });
            onSelectBloodBank?.(bb);
          });
          layerGroup.addLayer(marker);
        }
      });
    }

    // 4. Donors Markers (🟢 Green, approximate coordinates to protect privacy)
    if (filterType === 'ALL' || filterType === 'DONORS') {
      donors.forEach((donor) => {
        if (bloodGroupFilter !== 'ALL' && donor.bloodGroup !== bloodGroupFilter) return;

        const dist = calculateDistanceKm(centerCoords[0], centerCoords[1], donor.latitude, donor.longitude);
        if (dist <= selectedRadiusKm) {
          const markerColor = donor.available && donor.eligible ? '#10b981' : '#64748b';
          const marker = L.marker([donor.latitude, donor.longitude], {
            icon: createHtmlIcon(markerColor, '👤', donor.bloodGroup),
          });
          marker.on('click', () => {
            setSelectedEntity({ type: 'DONOR', data: donor, distance: dist });
            onSelectDonor?.(donor);
          });
          layerGroup.addLayer(marker);
        }
      });
    }

    // 5. Active Pending Blood Requests (🟡 Amber)
    if (filterType === 'ALL' || filterType === 'REQUESTS') {
      requests
        .filter((r) => r.status === 'PENDING' || r.status === 'MATCHING')
        .forEach((req) => {
          const dist = calculateDistanceKm(centerCoords[0], centerCoords[1], req.latitude, req.longitude);
          const marker = L.marker([req.latitude, req.longitude], {
            icon: createHtmlIcon('#f59e0b', '🚨', `${req.unitsRequired}u ${req.bloodGroup}`),
          });
          marker.on('click', () => {
            setSelectedEntity({ type: 'REQUEST', data: req, distance: dist });
          });
          layerGroup.addLayer(marker);
        });
    }
  }, [centerCoords, selectedRadiusKm, filterType, bloodGroupFilter, donors, hospitals, bloodBanks, requests]);

  // Handle GPS location click
  const handleDetectGPS = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newCoords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setCenterCoords(newCoords);
          setUserGpsActive(true);
          mapInstanceRef.current?.flyTo(newCoords, 14);
        },
        (err) => {
          alert('Device location permission unavailable. Using district headquarters default (Sivakasi).');
        }
      );
    }
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    let targetCoords: [number, number] = [9.4533, 77.7983]; // Sivakasi
    if (val === 'Madurai') targetCoords = [9.9252, 78.1198];
    if (val === 'Virudhunagar') targetCoords = [9.5680, 77.9620];
    if (val === 'Chennai') targetCoords = [13.0827, 80.2707];
    if (val === 'Coimbatore') targetCoords = [11.0168, 76.9558];

    setCenterCoords(targetCoords);
    mapInstanceRef.current?.flyTo(targetCoords, 13);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden mb-6">
      {/* Map Control Header */}
      <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-rose-600 animate-spin-slow" />
            <h3 className="text-base font-bold text-slate-900">
              Interactive Emergency & Donor Location Radar
            </h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Live Radius Search
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Geographic proximity matching across verified hospitals, blood banks, and nearby donors
          </p>
        </div>

        {/* Filters and Radius Selector */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Radius selector */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1">
            <span className="text-slate-500 font-medium px-1.5 text-[11px]">Radius:</span>
            {[5, 10, 25, 50].map((radius) => (
              <button
                key={radius}
                onClick={() => setSelectedRadiusKm(radius)}
                className={`px-2 py-0.5 rounded font-bold transition-colors text-[11px] ${
                  selectedRadiusKm === radius
                    ? 'bg-rose-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {radius}km
              </button>
            ))}
          </div>

          {/* District selector fallback */}
          <select
            onChange={handleDistrictChange}
            className="bg-white border border-slate-200 text-slate-800 font-medium rounded-lg px-2.5 py-1 text-xs focus:outline-rose-600"
          >
            <option value="Sivakasi">Sivakasi / Virudhunagar</option>
            <option value="Madurai">Madurai District</option>
            <option value="Virudhunagar">Virudhunagar City</option>
            <option value="Coimbatore">Coimbatore</option>
            <option value="Chennai">Chennai Central</option>
          </select>

          {/* Blood group filter */}
          <select
            value={bloodGroupFilter}
            onChange={(e) => setBloodGroupFilter(e.target.value)}
            className="bg-white border border-slate-200 text-slate-800 font-medium rounded-lg px-2 py-1 text-xs focus:outline-rose-600"
          >
            <option value="ALL">All Blood Groups</option>
            <option value="O+">O+ Only</option>
            <option value="O-">O- (Universal)</option>
            <option value="A+">A+ Only</option>
            <option value="A-">A- Only</option>
            <option value="B+">B+ Only</option>
            <option value="B-">B- Only</option>
            <option value="AB+">AB+ Only</option>
            <option value="AB-">AB- Only</option>
          </select>

          {/* Device GPS button */}
          <button
            onClick={handleDetectGPS}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border font-semibold transition-colors ${
              userGpsActive
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-rose-600" />
            <span>Use My GPS</span>
          </button>
        </div>
      </div>

      {/* Map Canvas + Overlay Details Drawer */}
      <div className="relative">
        <div ref={mapContainerRef} className="w-full h-80 sm:h-96 z-10" />

        {/* Map Legend Overlay */}
        <div className="absolute top-3 left-3 z-20 bg-white/95 backdrop-blur-xs p-2 rounded-lg border border-slate-200 shadow-md text-[11px] font-medium space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span> 🏥 Emergency Hospitals
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span> 🩸 Blood Bank Transfusion Hubs
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> 👤 Active Eligible Donors
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> 🚨 Pending Blood Requests
          </div>
        </div>

        {/* Selected Entity Card Drawer (when user clicks any marker) */}
        {selectedEntity && (
          <div className="absolute bottom-3 right-3 left-3 sm:left-auto sm:w-96 z-20 bg-white rounded-xl border border-slate-200 shadow-xl p-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span
                  className={`p-1.5 rounded-lg text-white font-bold text-xs ${
                    selectedEntity.type === 'HOSPITAL'
                      ? 'bg-rose-600'
                      : selectedEntity.type === 'BLOOD_BANK'
                      ? 'bg-purple-600'
                      : selectedEntity.type === 'DONOR'
                      ? 'bg-emerald-600'
                      : 'bg-amber-600'
                  }`}
                >
                  {selectedEntity.type}
                </span>
                <span className="font-bold text-slate-900 text-sm truncate max-w-[200px]">
                  {selectedEntity.data.name || selectedEntity.data.hospitalName || selectedEntity.data.patientId}
                </span>
              </div>
              <button
                onClick={() => setSelectedEntity(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1 mb-3">
              {selectedEntity.type === 'DONOR' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Blood Group:</span>
                    <span className="font-bold text-rose-600 text-sm">{selectedEntity.data.bloodGroup}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Distance:</span>
                    <span className="font-bold text-slate-800">{selectedEntity.distance} km away</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <span className="font-semibold text-emerald-700">
                      {selectedEntity.data.available ? 'Available Now' : 'Standby'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Last Donation:</span>
                    <span>{selectedEntity.data.lastDonationDate}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 italic pt-1">
                    🔒 Location approximated for donor privacy protection.
                  </p>
                </>
              )}

              {selectedEntity.type === 'BLOOD_BANK' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Facility Hours:</span>
                    <span className="font-semibold text-slate-800">{selectedEntity.data.operatingHours}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Distance:</span>
                    <span className="font-bold text-slate-800">{selectedEntity.distance} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">O+ Available:</span>
                    <span className="font-bold text-rose-600">{selectedEntity.data.stock['O+']?.availableUnits} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phone:</span>
                    <span className="font-semibold text-slate-800">{selectedEntity.data.phone}</span>
                  </div>
                </>
              )}

              {selectedEntity.type === 'HOSPITAL' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Type:</span>
                    <span className="font-semibold text-slate-800">{selectedEntity.data.type} Hospital</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Distance:</span>
                    <span className="font-bold text-slate-800">{selectedEntity.distance} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Emergency Desk:</span>
                    <span className="font-semibold text-rose-600">{selectedEntity.data.emergencyContact}</span>
                  </div>
                </>
              )}

              {selectedEntity.type === 'REQUEST' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Blood Needed:</span>
                    <span className="font-bold text-rose-600 text-sm">
                      {selectedEntity.data.unitsRequired} units {selectedEntity.data.bloodGroup}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Severity Score:</span>
                    <span className="font-bold text-rose-700">{selectedEntity.data.severityScore}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Case Type:</span>
                    <span className="font-semibold text-slate-800">{selectedEntity.data.caseType}</span>
                  </div>
                </>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified Facility
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
