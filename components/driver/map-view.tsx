// components/driver/map-view.tsx
"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { 
  GoogleMap, 
  LoadScript, 
  Marker, 
  InfoWindow 
} from "@react-google-maps/api"
import type { ParkingSpace } from "@/lib/types/parking"
import { Loader2, MapPin, Clock, DollarSign } from "lucide-react"

interface MapViewProps {
  spaces: ParkingSpace[]
  onSpaceSelect: (space: ParkingSpace | null) => void
  selectedSpace: ParkingSpace | null
  height?: string
}

const mapContainerStyle = {
  width: "100%",
  height: "100%",
  minHeight: "400px"
}

const defaultCenter = {
  lat: -1.286389,
  lng: 36.817223, // Nairobi, Kenya
}

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "transit",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
  ],
} as google.maps.MapOptions

// ✅ CUSTOM MARKER - No google.maps dependency
const getMarkerIcon = (isSelected: boolean) => ({
  path: "M 0,0 C -2,-20 2,-20 0,-30 A 0,1 0 0,0 2,-20 C 4,-20 6,-15 4,0 z",
  fillColor: isSelected ? "#ff6b35" : "#4CAF50",
  fillOpacity: 1,
  scale: isSelected ? 1 : 0.7,
  strokeColor: "#ffffff",
  strokeWeight: 3,
})

const spaceTypeIcons: Record<string, { icon: string; color: string }> = {
  driveway: { icon: "🏠", color: "blue" },
  garage: { icon: "🚗", color: "green" },
  lot: { icon: "🅿️", color: "purple" },
  street: { icon: "🚦", color: "orange" },
}

export function MapView({ 
  spaces, 
  onSpaceSelect, 
  selectedSpace, 
  height = "100%" 
}: MapViewProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mapLoading, setMapLoading] = useState(true)
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map())

  // ✅ FETCH API KEY
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const response = await fetch("/api/google-maps-key")
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        const data = await response.json()
        
        if (data.apiKey) {
          setApiKey(data.apiKey)
        } else {
          setError(data.error || "API key not found")
        }
      } catch (err: any) {
        console.error("Failed to fetch Google Maps API key:", err)
        setError(`Failed to load map: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchApiKey()
  }, [])

  // ✅ MAP LOAD - Safely access google.maps
  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    console.log("[Map] Loaded successfully")
    setMap(mapInstance)
    setMapLoading(false)

    // Auto-fit bounds to spaces
    if (spaces.length > 0) {
      const bounds = new google.maps.LatLngBounds()
      const validSpaces = spaces.filter(space => 
        space.location?.lat && space.location?.lng
      )
      
      validSpaces.forEach((space) => {
        bounds.extend(new google.maps.LatLng(
          space.location!.lat, 
          space.location!.lng
        ))
      })
      
      if (validSpaces.length > 0) {
        google.maps.event.addListenerOnce(mapInstance, 'bounds_changed', () => {
          mapInstance.setZoom(mapInstance.getZoom()! - 1) // Adjust zoom
        })
        mapInstance.fitBounds(bounds)
      }
    }
  }, [spaces])

  // ✅ CLEANUP MARKERS
  useEffect(() => {
    return () => {
      markersRef.current.forEach(marker => {
        marker.setMap(null)
      })
      markersRef.current.clear()
    }
  }, [])

  // ✅ HANDLE MARKER ANIMATIONS SAFELY
  const setMarkerAnimation = useCallback((marker: google.maps.Marker, shouldBounce: boolean) => {
    if (!marker) return
    
    try {
      // ✅ SAFE: Only access google.maps after map is loaded
      if (window.google?.maps?.Animation) {
        const animation = shouldBounce 
          ? window.google.maps.Animation.BOUNCE 
          : window.google.maps.Animation.DROP
        
        marker.setAnimation(animation)
        
        if (shouldBounce) {
          // Stop bounce after 2 seconds
          setTimeout(() => {
            marker.setAnimation(null)
          }, 2000)
        }
      }
    } catch (error) {
      console.warn("[Map] Animation failed:", error)
      // Fallback: no animation
    }
  }, [])

  // ✅ CREATE/UPDATE MARKERS
  useEffect(() => {
    if (!map || !window.google?.maps) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current.clear()

    spaces.forEach((space) => {
      if (!space.location?.lat || !space.location?.lng) return

      const marker = new window.google.maps.Marker({
        position: space.location,
        map,
        title: `${space.title} - KSh${space.pricePerHour}/hr`,
        icon: getMarkerIcon(selectedSpace?.id === space.id),
      })

      // Store marker reference
      markersRef.current.set(space.id, marker)

      // Click handler
      marker.addListener('click', () => {
        onSpaceSelect(space)
        setMarkerAnimation(marker, true)
      })

      // Set initial animation if selected
      if (selectedSpace?.id === space.id) {
        setMarkerAnimation(marker, true)
      }
    })
  }, [map, spaces, selectedSpace, onSpaceSelect, setMarkerAnimation])

  // ✅ MAP CLICK - Close selected space
  const onMapClick = useCallback(() => {
    onSpaceSelect(null)
  }, [onSpaceSelect])

  // ✅ CENTER ON SELECTED SPACE
  useEffect(() => {
    if (map && selectedSpace?.location) {
      map.panTo(new google.maps.LatLng(
        selectedSpace.location.lat,
        selectedSpace.location.lng
      ))
      map.setZoom(16)
    }
  }, [map, selectedSpace])

  // ✅ VALIDATE LOCATION
  const isValidLocation = useCallback((location?: { lat?: number; lng?: number }): location is { lat: number; lng: number } => {
    return location && 
           typeof location.lat === 'number' && 
           typeof location.lng === 'number' &&
           !isNaN(location.lat) && 
           !isNaN(location.lng) &&
           Math.abs(location.lat) <= 90 &&
           Math.abs(location.lng) <= 180
  }, [])

  if (loading) {
    return (
      <div className="relative w-full" style={{ height }}>
        <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-center p-6">
            <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading map configuration...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !apiKey) {
    return (
      <div className="relative w-full flex items-center justify-center bg-destructive/5 border border-destructive/20 rounded-lg p-6" style={{ height }}>
        <div className="text-center">
          <MapPin className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="font-semibold text-destructive mb-2">Map Unavailable</h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <p className="text-xs text-muted-foreground">
            Please check your internet connection and try again
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full rounded-lg overflow-hidden shadow-sm border relative" style={{ height }}>
      <LoadScript 
        googleMapsApiKey={apiKey}
        libraries={["places"]}
      >
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={defaultCenter}
          zoom={12}
          options={mapOptions}
          onLoad={onMapLoad}
          onClick={onMapClick}
        >
          {/* INFO WINDOW - Only render when map is ready */}
          {map && selectedSpace && isValidLocation(selectedSpace.location) && (
            <InfoWindow
              position={selectedSpace.location}
              onCloseClick={() => onSpaceSelect(null)}
              options={{
                pixelOffset: new window.google.maps.Size(0, -45),
                maxWidth: 300,
              }}
            >
              <div className="p-3 space-y-2 max-w-xs">
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0">
                    {spaceTypeIcons[selectedSpace.spaceType || 'driveway']?.icon || '🅿️'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm leading-tight">
                      {selectedSpace.title}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {selectedSpace.address}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-1 pt-1">
                  <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                    <DollarSign className="w-3 h-3" />
                    KSh {selectedSpace.pricePerHour}/hr
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {selectedSpace.features?.includes("24/7 Access") ? "24/7 Access" : "Check availability"}
                  </div>
                  
                  {selectedSpace.features && selectedSpace.features.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedSpace.features.slice(0, 3).map((feature) => (
                        <span key={feature} className="px-1 py-0.5 bg-primary/10 text-xs text-primary rounded">
                          {feature}
                        </span>
                      ))}
                      {selectedSpace.features.length > 3 && (
                        <span className="text-xs text-gray-400">+{selectedSpace.features.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onSpaceSelect(selectedSpace)
                  }}
                  className="w-full mt-3 px-3 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:bg-primary/90 transition-colors"
                >
                  Book Now
                </button>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>
      
      {/* LOADING OVERLAY */}
      {(mapLoading || loading) && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10 backdrop-blur-sm rounded-lg">
          <div className="text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-xs text-muted-foreground">
              {mapLoading ? "Loading map..." : "Loading spaces..."}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}