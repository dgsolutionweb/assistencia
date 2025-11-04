import React from 'react'

interface BarcodeScannerProps {
  isOpen?: boolean
  onClose?: () => void
  onScan?: (result: any) => void
}

// Minimal overlay scanner stub to unblock build
const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ isOpen, onClose, onScan }) => {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 w-80">
        <h3 className="font-semibold mb-2">Scanner</h3>
        <p className="text-sm text-gray-600 mb-4">Este é um stub do scanner.</p>
        <div className="flex items-center justify-between">
          <button className="px-3 py-2 rounded bg-gray-200" onClick={onClose}>Fechar</button>
          <button
            className="px-3 py-2 rounded bg-blue-600 text-white"
            onClick={() => onScan?.({ type: 'barcode', data: '1234567890' })}
          >
            Simular Scan
          </button>
        </div>
      </div>
    </div>
  )
}

export default BarcodeScanner