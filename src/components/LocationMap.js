'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import react-leaflet to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)

export default function LocationMap({ users, currentUser }) {
  const [isClient, setIsClient] = useState(false)

  // Center map on current user or default location
  const center = currentUser?.latitude
    ? [currentUser.latitude, currentUser.longitude]
    : [40.7128, -74.0060] // Default to NYC

  useEffect(() => {
    setIsClient(true)

    // Import Leaflet CSS and fix icons
    if (typeof window !== 'undefined') {
    //  import('leaflet/dist/leaflet.css')

      // Fix for default markers in Next.js
      import('leaflet').then((L) => {
        delete L.Icon.Default.prototype._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        })
      })
    }
  }, [])

  if (!isClient) {
    return (
      <div className="h-96 bg-gray-200 flex items-center justify-center rounded-lg">
        <div className="text-gray-600">Loading map...</div>
      </div>
    )
  }

  return (
  <MapContainer
    center={center}
    zoom={13}
    style={{ height: '500px', width: '100%' }} // Use an explicit height
    scrollWheelZoom={true}
  >
    <TileLayer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    />

    {users.map((user) => (
      user.latitude && user.longitude && (
        <Marker
          key={user.id}
          position={[user.latitude, user.longitude]}
        >
          <Popup>
            <div className="text-sm">
              <div className="font-semibold text-base">{user.name}</div>
              <div className="text-gray-600 mt-1">
                {user.id === currentUser?.id ? 'Your location' : 'Group member'}
              </div>
              {user.accuracy && (
                <div className="text-xs text-gray-500 mt-1">
                  Accuracy: ±{Math.round(user.accuracy)}m
                </div>
              )}
              <div className="text-xs text-gray-500 mt-1">
                Updated: {new Date(user.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </Popup>
        </Marker>
      )
    ))}
  </MapContainer>
)

}
