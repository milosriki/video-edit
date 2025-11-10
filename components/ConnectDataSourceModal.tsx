
import React from 'react';
import { FacebookIcon } from './icons';

interface ConnectDataSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulateConnect: () => void;
}

const ConnectDataSourceModal: React.FC<ConnectDataSourceModalProps> = ({ isOpen, onClose, onSimulateConnect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col border border-gray-700/50">
        <header className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-indigo-400 flex items-center gap-2">
            <FacebookIcon className="w-6 h-6"/>
            Connect to Facebook Ads
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </header>
        <div className="p-6 space-y-4">
            <p className="text-gray-300">
                In a live application, this would securely connect your Facebook account to pull in real-time advertising data.
            </p>
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <h4 className="font-bold mb-2">How it works:</h4>
                <ol className="list-decimal list-inside text-sm text-gray-400 space-y-2">
                    <li>You'll be redirected to Facebook to log in.</li>
                    <li>You'll be asked to grant this application permission to access your Ads Manager data.</li>
                    <li>Once approved, we securely synchronize your campaign performance.</li>
                </ol>
            </div>
            <p className="text-xs text-gray-500">
                This is a demo environment, so we'll simulate this connection. The dashboard will continue to use sample data.
            </p>
        </div>
        <footer className="p-4 bg-gray-900/50 border-t border-gray-700 flex justify-end gap-3">
             <button onClick={onClose} className="px-4 py-2 rounded-md font-semibold text-gray-300 hover:bg-gray-700 transition-colors">
                Cancel
             </button>
             <button onClick={onSimulateConnect} className="px-4 py-2 rounded-md font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-2">
                <FacebookIcon className="w-5 h-5" />
                Simulate Connection
             </button>
        </footer>
      </div>
    </div>
  );
};

export default ConnectDataSourceModal;
