import React, { useState, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Search, GripVertical, Trash2, MapPin, Upload } from 'lucide-react';
import { RouteStop } from './hooks/useRouteWizard';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationPicker({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function RouteStopBuilder({ stops, setStops }: { stops: RouteStop[], setStops: (stops: RouteStop[]) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([21.1702, 72.8311]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processImportData(results.data);
        }
      });
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        processImportData(data);
      };
      reader.readAsBinaryString(file);
    } else {
      alert("Unsupported file format. Please upload CSV or Excel.");
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processImportData = (data: any[]) => {
    const newStops: RouteStop[] = [];
    const baseSeq = stops.length;
    
    data.forEach((row, idx) => {
      const lat = parseFloat(row.latitude || row.lat);
      const lng = parseFloat(row.longitude || row.lng || row.lon);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        newStops.push({
          id: Math.random().toString(36).substr(2, 9),
          stop_name: row.stop_name || `Imported Stop ${baseSeq + idx + 1}`,
          latitude: lat,
          longitude: lng,
          sequence_number: baseSeq + newStops.length + 1,
          geofence_radius_meters: parseInt(row.geofence_radius || row.geofence_radius_meters) || 50,
        });
      }
    });

    if (newStops.length > 0) {
      setStops([...stops, ...newStops]);
      setMapCenter([newStops[0].latitude, newStops[0].longitude]);
    }
  };

  const SURAT_BOUNDS: L.LatLngBoundsExpression = [
    [20.10, 72.50], // South-West (Covers Valsad/Vapi)
    [21.90, 74.00]  // North-East (Covers Bharuch/Tapi)
  ];

  const searchLocation = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', Surat')}&viewbox=72.50,21.90,74.00,20.10&bounded=1`);
      const data = await res.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Geocoding failed", error);
    } finally {
      setIsSearching(false);
    }
  };

  const addStopFromResult = (result: any) => {
    const newStop: RouteStop = {
      id: Math.random().toString(36).substr(2, 9),
      stop_name: result.display_name.split(',')[0],
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      sequence_number: stops.length + 1,
      geofence_radius_meters: 50,
    };
    setStops([...stops, newStop]);
    setMapCenter([newStop.latitude, newStop.longitude]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const addStopFromMap = (lat: number, lng: number) => {
    const newStop: RouteStop = {
      id: Math.random().toString(36).substr(2, 9),
      stop_name: `Custom Stop ${stops.length + 1}`,
      latitude: lat,
      longitude: lng,
      sequence_number: stops.length + 1,
      geofence_radius_meters: 50,
    };
    setStops([...stops, newStop]);
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const items = Array.from(stops);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update sequence numbers
    const updatedItems = items.map((item, idx) => ({ ...item, sequence_number: idx + 1 }));
    setStops(updatedItems);
  };

  const removeStop = (id: string) => {
    const updatedStops = stops.filter(s => s.id !== id).map((s, idx) => ({ ...s, sequence_number: idx + 1 }));
    setStops(updatedStops);
  };

  const updateStopName = (id: string, name: string) => {
    setStops(stops.map(s => s.id === id ? { ...s, stop_name: name } : s));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[500px]">
      {/* Map Section */}
      <div className="flex flex-col h-full space-y-4">
        <div className="relative">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchLocation()}
            placeholder="Search location to add stop..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
          <button onClick={searchLocation} className="absolute right-2 top-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-200">
            {isSearching ? '...' : 'Search'}
          </button>
          
          {searchResults.length > 0 && (
            <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
              {searchResults.map((res: any, idx) => (
                <div key={idx} onClick={() => addStopFromResult(res)} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b last:border-0 border-slate-100 dark:border-slate-700">
                  <div className="text-sm font-medium text-slate-900 dark:text-white">{res.display_name.split(',')[0]}</div>
                  <div className="text-xs text-slate-500 truncate">{res.display_name}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex-1 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 z-0">
          <MapContainer center={mapCenter} zoom={13} maxBounds={SURAT_BOUNDS} maxBoundsViscosity={1.0} style={{ height: '100%', width: '100%' }}>
            <TileLayer 
              url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" 
              attribution="&copy; Google Maps"
            />
            <LocationPicker onLocationSelect={addStopFromMap} />
            {stops.map((stop) => (
              <Marker key={stop.id} position={[stop.latitude, stop.longitude]} />
            ))}
          </MapContainer>
        </div>
        <p className="text-xs text-slate-500">Tip: Click on the map to drop a pin.</p>
      </div>

      {/* List Section */}
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center">
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-indigo-500" /> Route Stops ({stops.length})
          </h3>
          <div>
            <input 
              type="file" 
              accept=".csv,.xlsx,.xls" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center px-3 py-1.5 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400"
            >
              <Upload className="w-4 h-4 mr-1.5" /> Bulk Import
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {stops.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
              No stops added yet. Search or click the map.
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="stops">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {stops.map((stop, index) => (
                      <Draggable key={stop.id} draggableId={stop.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`p-3 bg-white dark:bg-slate-800 border rounded-lg flex items-center gap-3 ${snapshot.isDragging ? 'border-indigo-500 shadow-lg' : 'border-slate-200 dark:border-slate-700 shadow-sm'}`}
                          >
                            <div {...provided.dragHandleProps} className="text-slate-400 hover:text-slate-600">
                              <GripVertical className="w-5 h-5" />
                            </div>
                            <div className="flex justify-center items-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold shrink-0">
                              {stop.sequence_number}
                            </div>
                            <div className="flex-1 min-w-0">
                              <input 
                                type="text"
                                value={stop.stop_name}
                                onChange={(e) => updateStopName(stop.id, e.target.value)}
                                className="w-full bg-transparent border-0 p-0 focus:ring-0 text-sm font-medium text-slate-900 dark:text-white"
                              />
                              <div className="text-[10px] text-slate-500 font-mono mt-1">
                                {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}
                              </div>
                            </div>
                            <button onClick={() => removeStop(stop.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg shrink-0">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      </div>
    </div>
  );
}
