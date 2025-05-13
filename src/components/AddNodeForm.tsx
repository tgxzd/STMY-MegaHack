import { useState } from 'react';

interface AddNodeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (nodeName: string) => void;
}

export default function AddNodeForm({ isOpen, onClose, onSubmit }: AddNodeFormProps) {
  const [nodeName, setNodeName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(nodeName);
    setNodeName('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
      <div className="bg-white/10 border border-white/20 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium text-white/90">Add New Node</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white/90 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="nodeName" className="block text-sm font-medium text-white/70 mb-2">
              Node Name
            </label>
            <input
              type="text"
              id="nodeName"
              value={nodeName}
              onChange={(e) => setNodeName(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none transition-all text-white/90 placeholder-white/40"
              placeholder="Enter node name"
              required
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-white/70 hover:text-white/90 hover:bg-white/5 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-500/90 text-white rounded-xl hover:bg-emerald-500 transition-all"
            >
              Add Node
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 