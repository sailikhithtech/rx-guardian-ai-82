import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation, Clock, Star, Phone, ExternalLink, Search, LocateFixed, Filter } from "lucide-react";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Pharmacy {
  id: number;
  name: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  distance: string;
  rating: number;
  open: boolean;
  is24hr: boolean;
}

const DEFAULT_CENTER: [number, number] = [17.385, 78.4867];

const pharmacies: Pharmacy[] = [
  { id: 1, name: "MedPlus Pharmacy", address: "Road No. 12, Banjara Hills, Hyderabad", phone: "+91 40 2335 5678", lat: 17.4156, lng: 78.4347, distance: "0.8 km", rating: 4.5, open: true, is24hr: false },
  { id: 2, name: "Apollo Pharmacy", address: "Jubilee Hills Check Post, Hyderabad", phone: "+91 40 2360 1234", lat: 17.4310, lng: 78.4070, distance: "1.2 km", rating: 4.7, open: true, is24hr: true },
  { id: 3, name: "Wellness Forever", address: "Madhapur Main Road, Hyderabad", phone: "+91 40 2311 9876", lat: 17.4435, lng: 78.3772, distance: "2.1 km", rating: 4.2, open: false, is24hr: false },
  { id: 4, name: "Netmeds Store", address: "Himayatnagar, Hyderabad", phone: "+91 40 2760 4321", lat: 17.3950, lng: 78.4983, distance: "2.5 km", rating: 4.0, open: true, is24hr: false },
  { id: 5, name: "Ramesh Medicals", address: "Ameerpet, Hyderabad", phone: "+91 40 2373 8765", lat: 17.4375, lng: 78.4483, distance: "1.6 km", rating: 4.3, open: true, is24hr: false },
  { id: 6, name: "Sai Krishna Pharmacy", address: "Kukatpally Housing Board, Hyderabad", phone: "+91 40 2305 6543", lat: 17.4947, lng: 78.3996, distance: "3.8 km", rating: 4.1, open: true, is24hr: true },
  { id: 7, name: "Care Pharmacy 24x7", address: "Secunderabad Railway Station Road", phone: "+91 40 2770 2222", lat: 17.4344, lng: 78.5013, distance: "3.2 km", rating: 4.6, open: true, is24hr: true },
  { id: 8, name: "Hetero Pharmacy", address: "HITEC City, Madhapur, Hyderabad", phone: "+91 40 2312 7890", lat: 17.4486, lng: 78.3814, distance: "2.9 km", rating: 3.9, open: false, is24hr: false },
];

function getDirectionsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

type FilterType = "all" | "open" | "24hr" | "rated";

export default function NearbyPharmacies() {
  const [searchQuery, setSearchQuery] = useState("");
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const filtered = pharmacies.filter((p) => {
    if (filter === "open") return p.open;
    if (filter === "24hr") return p.is24hr;
    if (filter === "rated") return p.rating >= 4.5;
    return true;
  }).filter((p) =>
    searchQuery === "" ||
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView(center, 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update center
  useEffect(() => {
    mapRef.current?.setView(center, 13);
  }, [center]);

  // Update markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    filtered.forEach((p) => {
      const marker = L.marker([p.lat, p.lng])
        .addTo(map)
        .bindPopup(
          `<div style="min-width:180px">
            <p style="font-weight:600;margin:0 0 4px">${p.name}</p>
            <p style="font-size:12px;color:#666;margin:0 0 4px">${p.address}</p>
            <p style="font-size:12px;margin:0 0 6px">📞 ${p.phone}</p>
            <a href="${getDirectionsUrl(p.lat, p.lng)}" target="_blank" rel="noopener noreferrer" style="font-size:12px;color:#4F8EF7;font-weight:500;text-decoration:none">📍 Get Directions</a>
          </div>`
        )
        .on("click", () => setSelectedId(p.id));

      markersRef.current.push(marker);
    });
  }, [filtered]);

  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    toast.loading("Getting your location...", { id: "geo" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter([pos.coords.latitude, pos.coords.longitude]);
        toast.success("Location updated!", { id: "geo" });
      },
      () => toast.error("Unable to get your location", { id: "geo" })
    );
  }, []);

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "open", label: "Open Now" },
    { key: "24hr", label: "24 Hours" },
    { key: "rated", label: "Highest Rated" },
  ];

  return (
    <div className="page-container">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MapPin className="w-7 h-7 text-primary" /> Nearby Pharmacies
        </h1>
        <p className="text-muted-foreground mt-1">Find pharmacies near you and get directions</p>
      </div>

      {/* Search + Location + Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-xl"
            />
          </div>
          <Button variant="outline" className="rounded-xl gap-2 shrink-0" onClick={useMyLocation}>
            <LocateFixed className="w-4 h-4" /> My Location
          </Button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                filter === f.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map + List */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Map */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-3 bg-card rounded-2xl border border-border overflow-hidden" style={{ minHeight: 420 }}>
          <div ref={mapContainerRef} style={{ height: "100%", minHeight: 420, zIndex: 0 }} />
        </motion.div>

        {/* Pharmacy List */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 space-y-3 max-h-[520px] overflow-y-auto pr-1">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-sm text-muted-foreground">No pharmacies match your filter.</div>
          )}
          {filtered.map((p) => (
            <div
              key={p.id}
              onClick={() => {
                setSelectedId(p.id);
                mapRef.current?.setView([p.lat, p.lng], 15);
              }}
              className={`bg-card rounded-xl border p-4 space-y-2 cursor-pointer transition-all hover:shadow-md ${
                selectedId === p.id ? "border-primary ring-1 ring-primary/20" : "border-border"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-sm">{p.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.address}</p>
                </div>
                <Badge
                  variant="outline"
                  className={`shrink-0 text-[10px] rounded-full ${
                    p.open
                      ? "border-success/30 text-success bg-success/5"
                      : "border-destructive/30 text-destructive bg-destructive/5"
                  }`}
                >
                  {p.open ? "Open" : "Closed"}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {p.distance}</span>
                <span className="flex items-center gap-1"><Star className="w-3 h-3 text-warning fill-warning" /> {p.rating}</span>
                {p.is24hr && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 24hrs</span>}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-muted-foreground"><Phone className="w-3 h-3" /> {p.phone}</span>
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
