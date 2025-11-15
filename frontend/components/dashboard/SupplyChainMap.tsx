'use client'

import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import { Icon } from 'leaflet'
import { Shipment } from '@/lib/api/products'
import 'leaflet/dist/leaflet.css'

interface SupplyChainMapProps {
  shipments?: { shipments: Shipment[] }
  mapCenter: [number, number]
}

const SupplyChainMap: React.FC<SupplyChainMapProps> = ({ shipments, mapCenter }) => {
  const [icons, setIcons] = useState<{
    truck: Icon | null
    warehouse: Icon | null
  }>({
    truck: null,
    warehouse: null
  })

  useEffect(() => {
    // Only create icons on client side
    if (typeof window !== 'undefined') {
      const truckIcon = new Icon({
        iconUrl: '/icons/truck.svg',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
        shadowUrl: '/icons/shadow.png',
        shadowSize: [41, 41],
        shadowAnchor: [13, 41],
      })

      const warehouseIcon = new Icon({
        iconUrl: '/icons/warehouse.svg',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
        shadowUrl: '/icons/shadow.png',
        shadowSize: [41, 41],
        shadowAnchor: [13, 41],
      })

      setIcons({
        truck: truckIcon,
        warehouse: warehouseIcon
      })
    }
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return '✅'
      case 'in-transit':
        return '🚛'
      case 'delayed':
        return '⚠️'
      default:
        return '📦'
    }
  }

  if (!icons.truck || !icons.warehouse) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-xl flex items-center justify-center">
        <div className="text-gray-500">Loading map...</div>
      </div>
    )
  }

  return (
    <div className="w-full h-96 rounded-xl overflow-hidden border border-gray-200">
      <MapContainer
        center={mapCenter}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {shipments?.shipments?.map((shipment) => (
          <div key={shipment.id}>
            {/* Shipment route */}
            {shipment.route && (
              <Polyline
                positions={shipment.route}
                color="#3b82f6"
                weight={3}
                opacity={0.7}
              />
            )}

            {/* Current location */}
            {shipment.currentLocation && (
              <Marker
                position={shipment.currentLocation}
                icon={icons.truck}
              >
                <Popup>
                  <div className="p-2">
                    <h4 className="font-semibold">{shipment.id}</h4>
                    <p className="text-sm text-gray-600">
                      Status: {shipment.status}
                    </p>
                    <p className="text-sm text-gray-600">
                      ETA: {shipment.estimatedArrival}
                    </p>
                    <div className="flex items-center mt-1">
                      {getStatusIcon(shipment.status)}
                      <span className="ml-1 text-xs">
                        {shipment.status}
                      </span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Destination */}
            <Marker
              position={shipment.destination}
              icon={icons.warehouse}
            >
              <Popup>
                <div className="p-2">
                  <h4 className="font-semibold">Destination</h4>
                  <p className="text-sm text-gray-600">
                    {shipment.destinationName}
                  </p>
                </div>
              </Popup>
            </Marker>
          </div>
        ))}
      </MapContainer>
    </div>
  )
}

export default SupplyChainMap