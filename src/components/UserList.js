'use client'

export default function UserList({ users, currentUser }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">Group Members</h3>
      <div className="space-y-2">
        {users.length === 0 ? (
          <div className="text-gray-500 text-sm text-center py-4">
            No members found
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    user.is_online ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                  }`}
                />
                <span className="font-medium text-gray-800">
                  {user.name} {user.id === currentUser?.id && '(You)'}
                </span>
              </div>
              <div className="text-sm">
                {user.latitude && user.longitude ? (
                  <span className="text-green-600 font-medium">📍 Sharing</span>
                ) : (
                  <span className="text-gray-400">No location</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      {users.length > 0 && (
        <div className="mt-3 text-xs text-gray-500 text-center">
          {users.filter(u => u.is_online).length} of {users.length} members online
        </div>
      )}
    </div>
  )
}
