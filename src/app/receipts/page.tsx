'use client'
import { useState, useEffect } from 'react'

interface Receipt {
  id: string;
  merchant: string | null;
  date: Date | string;
  total: number;
  parsed: boolean;
  items?: any[];
}

export default function Receipts() {
  const [showModal, setShowModal] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchReceipts = async () => {
    try {
      const response = await fetch('/api/receipts');
      const data = await response.json();
      setReceipts(data.receipts || []);
    } catch (error) {
      console.error('Error fetching receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file first');
      return;
    }

    setUploading(true);

    try {
      // Step 1: Upload file
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/receipts', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error);
      }

      // Step 2: Parse with GPT-4 Vision
      alert('Receipt uploaded! Processing with AI...');

      const parseResponse = await fetch('/api/receipts/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptId: uploadData.receipt.id }),
      });

      const parseData = await parseResponse.json();

      if (parseResponse.ok) {
        alert(
          `Receipt scanned successfully!\n\n` +
          `Merchant: ${parseData.data.merchant}\n` +
          `Total: $${parseData.data.total.toFixed(2)}\n` +
          `Items: ${parseData.data.items.length}`
        );
        setShowModal(false);
        setFile(null);
        fetchReceipts();
      } else {
        const errorMsg = parseData.message || parseData.error || 'Unknown error';
        const errorDetails = parseData.details ? `\n\nDetails: ${parseData.details}` : '';
        throw new Error(errorMsg + errorDetails);
      }
    } catch (error: any) {
      console.error('Error:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      alert('Error: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading receipts...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Receipts ({receipts.length})</h1>
        <div className="flex gap-3">
          <button
            onClick={async () => {
              setLoading(true);
              await fetchReceipts();
            }}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 flex items-center gap-2"
            disabled={loading}
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            + Upload Receipt
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Upload Receipt</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Select Receipt Image</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                className="w-full p-2 border rounded"
              />
            </div>

            {file && (
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <p className="text-sm">Selected: {file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
            )}

            <div className="flex gap-3">
              <button 
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {uploading ? 'Processing...' : 'Upload & Scan'}
              </button>
              <button 
                onClick={() => {
                  setShowModal(false);
                  setFile(null);
                }}
                className="flex-1 bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {receipts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No receipts yet. Upload your first receipt!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {receipts.map((receipt) => (
            <div key={receipt.id} className="bg-white p-6 border rounded-lg shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold">{receipt.merchant || 'Unknown'}</h3>
                  <p className="text-sm text-gray-500">
                    {receipt.date ? new Date(receipt.date).toLocaleDateString() : 'No date'}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  receipt.parsed
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {receipt.parsed ? 'PARSED' : 'PENDING'}
                </span>
              </div>
              <div className="mb-4">
                <p className="text-2xl font-bold">${receipt.total?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="text-sm text-gray-600">
                <p>{receipt.items?.length || 0} items</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}