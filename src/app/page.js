'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export default function Home() {
  const [name, setName] = useState('')
  const [groupId, setGroupId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const createGroup = async () => {
    if (!name.trim()) {
      alert('Please enter your name')
      return
    }

    setIsLoading(true)
    const newGroupId = uuidv4().slice(0, 8).toUpperCase()
    const userId = uuidv4()

    try {
      const { error } = await supabase
        .from('users')
        .insert({
          id: userId,
          name: name.trim(),
          group_id: newGroupId,
          is_online: false
        })

      if (error) throw error

      // Store user info in sessionStorage
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('userId', userId)
        sessionStorage.setItem('userName', name.trim())
      }

      router.push(`/group/${newGroupId}`)
    } catch (error) {
      console.error('Error creating group:', error)
      alert('Failed to create group. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const joinGroup = async () => {
    if (!name.trim() || !groupId.trim()) {
      alert('Please enter your name and group ID')
      return
    }

    setIsLoading(true)
    const userId = uuidv4()

    try {
      // Check if group exists
      const { data: existingGroup } = await supabase
        .from('users')
        .select('group_id')
        .eq('group_id', groupId.trim().toUpperCase())
        .limit(1)

      if (!existingGroup || existingGroup.length === 0) {
        throw new Error('Group not found')
      }

      const { error } = await supabase
        .from('users')
        .insert({
          id: userId,
          name: name.trim(),
          group_id: groupId.trim().toUpperCase(),
          is_online: false
        })

      if (error) throw error

      // Store user info in sessionStorage
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('userId', userId)
        sessionStorage.setItem('userName', name.trim())
      }

      router.push(`/group/${groupId.trim().toUpperCase()}`)
    } catch (error) {
      console.error('Error joining group:', error)
      alert('Failed to join group. Please check the group ID and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-4xl mb-2">📍</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Location Tracker</h1>
            <p className="text-gray-600">Share your location with friends and family</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your name"
                  disabled={isLoading}
                />
              </div>

              <div className="border-t pt-4">
                <button
                  onClick={createGroup}
                  disabled={!name.trim() || isLoading}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg mb-4 transition-colors"
                >
                  {isLoading ? 'Creating...' : 'Create New Group'}
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or join existing</span>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <input
                    type="text"
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter group ID (e.g., ABC123)"
                    disabled={isLoading}
                  />
                  <button
                    onClick={joinGroup}
                    disabled={!name.trim() || !groupId.trim() || isLoading}
                    className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    {isLoading ? 'Joining...' : 'Join Group'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>📱 Works on mobile and desktop</p>
            <p>🔒 Your location is only shared with group members</p>
          </div>
        </div>
      </div>
    </div>
  )
}
