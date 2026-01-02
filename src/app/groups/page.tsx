'use client'
import { useState, useEffect } from 'react'

interface Group {
  id: string;
  name: string;
  description: string | null;
  memberCount?: number;
  totalExpenses?: number;
  pendingDebts?: number;
}

export default function Groups() {
  const [showModal, setShowModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups');
      const data = await response.json();
      setGroups(data.groups || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      alert('Please enter a group name');
      return;
    }

    setCreating(true);

    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: groupName, description: description }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Group created successfully!');
        setShowModal(false);
        setGroupName('');
        setDescription('');
        fetchGroups();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      alert('Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Groups ({groups.length})</h1>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={async () => {
              setLoading(true);
              await fetchGroups();
            }}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 flex items-center gap-2"
            disabled={loading}
          >
            🔄 Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            + Create Group
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Create New Group</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Group Name</label>
              <input 
                type="text" 
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Weekend Trip"
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                className="w-full p-2 border rounded h-24"
              />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={handleCreateGroup}
                disabled={creating}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-200 px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {groups.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No groups yet. Create one!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.id} className="bg-white p-6 border rounded-lg shadow">
              <h3 className="text-xl font-bold">{group.name}</h3>
              <p className="text-gray-600">{group.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}