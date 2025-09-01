'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export default function LocationSharing({ user, onLocationUpdate }) {
  const [isSharing, setIsSharing] = useState(false)
  const [locationError, setLocationError] = useState(null)
  const [watchId, setWatchId] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)

  const updateLocation = useCallback(async (position) => {
    const { latitude, longitude, accuracy } = position.coords

    try {
      // Update location in database
      const { error } = await supabase
        .from('locations')
        .upsert({
          user_id: user.id,
          latitude,
          longitude,
          accuracy,
          timestamp: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (error) throw error

      // Update user online status
      await supabase
        .from('users')
        .update({ is_online: true })
        .eq('id', user.id)

      onLocationUpdate({ latitude, longitude, accuracy })
      setLastUpdate(new Date())
      setLocationError(null)
    } catch (error) {
      console.error('Error updating location:', error)
      setLocationError('Failed to update location')
    }
  }, [user.id, onLocationUpdate])

  const startLocationSharing = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser')
      return
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000
    }

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      updateLocation,
      (error) => setLocationError(`Location error: ${error.message}`),
      options
    )

    // Watch position changes
    const id = navigator.geolocation.watchPosition(
      updateLocation,
      (error) => {
        setLocationError(`Location error: ${error.message}`)
      },
      options
    )

    setWatchId(id)
    setIsSharing(true)
  }, [updateLocation])

  const stopLocationSharing = useCallback(async () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }

    // Update user offline status
    try {
      await supabase
        .from('users')
        .update({ is_online: false })
        .eq('id', user.id)
    } catch (error) {
      console.error('Error updating offline status:', error)
    }

    setIsSharing(false)
    setLastUpdate(null)
  }, [watchId, user.id])

  useEffect(() => {
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [watchId])

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">Location Sharing</h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-700">
              Share your location
            </div>
            <div className="text-xs text-gray-500">
              Updates automatically while sharing
            </div>
          </div>
          <button
            onClick={isSharing ? stopLocationSharing : startLocationSharing}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isSharing
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isSharing ? 'Stop' : 'Start'}
          </button>
        </div>

        {locationError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            <div className="font-medium">Location Error</div>
            <div>{locationError}</div>
          </div>
        )}

        {isSharing && !locationError && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium">Location sharing active</span>
            </div>
            {lastUpdate && (
              <div className="text-xs text-green-600 mt-1">
                Last update: {lastUpdate.toLocaleTimeString()}
              </div>
            )}
          </div>
        )}

        {!isSharing && (
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            💡 Tip: Allow location access when prompted for best experience
          </div>
        )}
      </div>
    </div>
  )
}
