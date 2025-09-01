'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import LocationMap from '../../../components/LocationMap'
import UserList from '../../../components/UserList'
import LocationSharing from '../../../components/LocationSharing'

export default function GroupPage() {
  const router = useRouter()
  const params = useParams()
  const groupId = params?.id
  const [users, setUsers] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadUsers = useCallback(async () => {
    if (!groupId) return

    try {
      // Get users in group
      const { data: groupUsers, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('group_id', groupId)

      if (usersError) throw usersError

      if (!groupUsers || groupUsers.length === 0) {
        setError('Group not found or no members')
        setLoading(false)
        return
      }

      // Get latest locations for each user
      const userIds = groupUsers.map(u => u.id)
      const { data: locations, error: locationsError } = await supabase
        .from('locations')
        .select('*')
        .in('user_id', userIds)
        .order('timestamp', { ascending: false })

      if (locationsError) throw locationsError

      // Combine users with their latest locations
      const usersWithLocations = groupUsers.map(user => {
        const userLocation = locations.find(loc => loc.user_id === user.id)
        return {
          ...user,
          latitude: userLocation?.latitude,
          longitude: userLocation?.longitude,
          accuracy: userLocation?.accuracy,
          timestamp: userLocation?.timestamp
        }
      })

      setUsers(usersWithLocations)
      setError(null)
    } catch (error) {
      console.error('Error loading users:', error)
      setError('Failed to load group data')
    } finally {
      setLoading(false)
    }
  }, [groupId])

  const subscribeToUpdates = useCallback(() => {
    if (!groupId) return

    // Subscribe to user changes
    const userSubscription = supabase
      .channel(`users-${groupId}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `group_id=eq.${groupId}`
        },
        () => loadUsers()
      )
      .subscribe()

    // Subscribe to location changes
    const locationSubscription = supabase
      .channel(`locations-${groupId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'locations' },
        () => loadUsers()
      )
      .subscribe()

    return () => {
      userSubscription.unsubscribe()
      locationSubscription.unsubscribe()
    }
  }, [groupId, loadUsers])

  useEffect(() => {
    if (!groupId) return

    // Get current user from session
    const userId = typeof window !== 'undefined' ? sessionStorage.getItem('userId') : null
    const userName = typeof window !== 'undefined' ? sessionStorage.getItem('userName') : null

    if (!userId || !userName) {
      router.push('/')
      return
    }

    setCurrentUser({ id: userId, name: userName })
    loadUsers()

    const unsubscribe = subscribeToUpdates()

    // Cleanup on unmount
    return () => {
      if (unsubscribe) unsubscribe()
      if (userId) {
        supabase
          .from('users')
          .update({ is_online: false })
          .eq('id', userId)
      }
    }
  }, [groupId, loadUsers, subscribeToUpdates, router])

  const handleLocationUpdate = useCallback((location) => {
    // Update current user's location in state
    setUsers(prev => prev.map(user =>
      user.id === currentUser?.id
        ? { ...user, ...location, timestamp: new Date().toISOString() }
        : user
    ))
  }, [currentUser?.id])

  const copyGroupId = async () => {
    try {
      await navigator.clipboard.writeText(groupId)
      // Simple feedback without external dependencies
      const originalText = document.getElementById('copy-btn').textContent
      document.getElementById('copy-btn').textContent = 'Copied!'
      setTimeout(() => {
        document.getElementById('copy-btn').textContent = originalText
      }, 2000)
    } catch (error) {
      // Fallback for older browsers
      alert(`Group ID: ${groupId}`)
    }
  }

  const leaveGroup = async () => {
    if (!currentUser) return

    try {
      await supabase
        .from('users')
        .delete()
        .eq('id', currentUser.id)

      // Clear session
      if (typeof window !== 'undefined') {
        sessionStorage.clear()
      }

      router.push('/')
    } catch (error) {
      console.error('Error leaving group:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-xl text-gray-600">Loading group...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Group: <span className="text-blue-600">{groupId}</span>
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {users.length} member{users.length !== 1 ? 's' : ''} • {users.filter(u => u.is_online).length} online
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  id="copy-btn"
                  onClick={copyGroupId}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg border transition-colors"
                >
                  Copy Group ID
                </button>
                <button
                  onClick={leaveGroup}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors"
                >
                  Leave Group
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Live Map</h2>
                  <div className="text-sm text-gray-500">
                    {users.filter(u => u.latitude && u.longitude).length} location{users.filter(u => u.latitude && u.longitude).length !== 1 ? 's' : ''} visible
                  </div>
                </div>
              { /*  <LocationMap users={users} currentUser={currentUser} /> */ }
              <LocationMap
                key={groupId}
                users={users}
                currentUser={currentUser}
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {currentUser && (
                <LocationSharing
                  user={currentUser}
                  onLocationUpdate={handleLocationUpdate}
                />
              )}
              <UserList users={users} currentUser={currentUser} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
