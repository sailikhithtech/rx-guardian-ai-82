import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation, Phone, ExternalLink, Search, LocateFixed, Loader2 } from "lucide-react";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Pharmacy {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance: number;
}

const DEFAULT_CENTER: [number, number] = [17.385, 78.4867];

function getDirectionsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const userIcon = L.divIcon({
  className: "",
  html: `<div style="width:18px;height:18px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 8px rgba(59,130,246,0.6)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const pharmacyIcon = L.divIcon({
  className: "",
  html: `<div style="width:14px;height:14px;background:#ef4444;border:2px solid white;border-radius:50%;box-shadow:0 0 4px rgba(0,0,0,0.3)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export default function NearbyPharmacies() {
  const [searchQuery, setSearchQuery] = useState("");
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const center = userPos || DEFAULT_CENTER;

  const fetchPharmacies = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const radius = 3000;
      const query = `[out:json][timeout:10];node["amenity"="pharmacy"](around:${radius},${lat},${lng});out body;`;
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: `data=${encodeURIComponent(query)}`,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      const data = await res.json();
      const results: Pharmacy[] = (data.elements || []).map((el: any, i: number) => ({
        id: el.id || i,
        name: el.tags?.name || "Pharmacy",
        address: el.tags?.["addr:street"] ? `${el.tags["addr:housenumber"] || ""} ${el.tags["addr:street"]}`.trim() : (el.tags?.["addr:full"] || "Address not available"),
        lat: el.lat,
        lng: el.lon,
        distance: haversine(lat, lng, el.lat, el.lon),
      }));
      results.sort((a, b) => a.distance - b.distance);
      setPharmacies(results);
    } catch {
      toast.error("Could not fetch nearby pharmacies");
    } finally {
      setLoading(false);
    }
  }, []);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    toast.loading("Getting your location...", { id: "geo" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(loc);
        toast.success("Location updated!", { id: "geo" });
        fetchPharmacies(loc[0], loc[1]);
      },
      () => {
        toast.error("Location denied, using default", { id: "geo" });
        setUserPos(null);
        fetchPharmacies(DEFAULT_CENTER[0], DEFAULT_CENTER[1]);
      }
    );
  }, [fetchPharmacies]);

  // Init: detect location
  useEffect(() => { detectLocation(); }, [detectLocation]);

  // Init map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = L.map(mapContainerRef.current).setView(center, 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    }).addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Update map center + user marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setView(center, 14);
    if (userMarkerRef.current) userMarkerRef.current.remove();
    userMarkerRef.current = L.marker(center, { icon: userIcon })
      .addTo(map)
      .bindPopup("<b>📍 You are here</b>");
  }, [center]);

  // Update pharmacy markers
  const filtered = pharmacies.filter(
    (p) => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    filtered.forEach((p) => {
      const marker = L.marker([p.lat, p.lng], { icon: pharmacyIcon })
        .addTo(map)
        .bindPopup(`<b>${p.name}</b><br/><span style="font-size:12px">${p.address}</span><br/><a href="${getDirectionsUrl(p.lat, p.lng)}" target="_blank" style="font-size:12px;color:#3b82f6">Get Directions →</a>`)
        .on("click", () => setSelectedId(p.id));
      markersRef.current.push(marker);
    });
  }, [filtered]);

  const formatDist = (km: number) => km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;

  return (
    <div className="page-container">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MapPin className="w-7 h-7 text-primary" /> Nearby Pharmacies
        </h1>
        <p className="text-muted-foreground mt-1">Real pharmacies near you via OpenStreetMap</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search pharmacies..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 rounded-xl" />
        </div>
        <Button variant="outline" className="rounded-xl gap-2 shrink-0" onClick={detectLocation}>
          <LocateFixed className="w-4 h-4" /> Refresh Location
        </Button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Finding nearby pharmacies...
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-3 bg-card rounded-2xl border border-border overflow-hidden" style={{ minHeight: 420 }}>
          <div ref={mapContainerRef} style={{ height: "100%", minHeight: 420, zIndex: 0 }} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 space-y-3 max-h-[520px] overflow-y-auto pr-1">
          {!loading && filtered.length === 0 && (
            <div className="text-center py-12 text-sm text-muted-foreground">No pharmacies found nearby.</div>
          )}
          {filtered.map((p) => (
            <div
              key={p.id}
              onClick={() => { setSelectedId(p.id); mapRef.current?.setView([p.lat, p.lng], 16); }}
              className={`bg-card rounded-xl border p-4 space-y-2 cursor-pointer transition-all hover:shadow-md ${selectedId === p.id ? "border-primary ring-1 ring-primary/20" : "border-border"}`}
            >
              <h3 className="font-semibold text-sm">{p.name}</h3>
              <p className="text-xs text-muted-foreground">{p.address}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {formatDist(p.distance)}</span>
              </div>
              <a
                href={getDirectionsUrl(p.lat, p.lng)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <Navigation className="w-3 h-3" /> Get Directions <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
