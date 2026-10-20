import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for Leaflet default marker icons not showing in React
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})
L.Marker.prototype.options.icon = DefaultIcon

// Coordinates for the cities used in your Python seeder script
const cityCoords = {
  'Bangalore': [12.9716, 77.5946], 'Mysore': [12.2958, 76.6394],
  'Chennai': [13.0827, 80.2707], 'Coorg': [12.3375, 75.8069],
  'Ooty': [11.4064, 76.6932], 'Pondicherry': [11.9416, 79.8083],
  'Hyderabad': [17.3850, 78.4867], 'Vijayawada': [16.5062, 80.6480],
  'Mangalore': [12.9141, 74.8560], 'Udupi': [13.3409, 74.7421],
  'Hubli': [15.3647, 75.1240], 'Goa': [15.2993, 74.1240],
}

export default function FleetMap({ trips }) {
  // Center the map on the origin of the first upcoming trip
  const centerCity = trips.length > 0 ? trips[0].origin : 'Bangalore'
  const center = cityCoords[centerCity] || [12.9716, 77.5946] // Default to Bangalore

  return (
    <MapContainer 
      center={center} 
      zoom={7} 
      style={{ height: '100%', width: '100%', borderRadius: '6px', zIndex: 0 }}
    >
      {/* OpenStreetMap Tile Layer (Free, no API key needed) */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Draw routes for trips */}
      {trips.map((trip) => {
        const start = cityCoords[trip.origin]
        const end = cityCoords[trip.destination]
        
        if (!start || !end) return null

        return (
          <Polyline 
            key={`line-${trip.id}`} 
            positions={[start, end]} 
            color="#12376c" 
            weight={3} 
            opacity={0.6}
            dashArray="8, 8" // Dashed line looks better for planned routes
          >
            <Popup>
              <div style={{ fontFamily: 'Inter, sans-serif' }}>
                <strong style={{ color: '#001b44' }}>{trip.vehicle_plate}</strong><br/>
                {trip.origin} → {trip.destination}<br/>
                <small>{trip.driver_name}</small>
              </div>
            </Popup>
          </Polyline>
        )
      })}

      {/* Draw markers for active cities */}
      {Object.entries(cityCoords).map(([city, coords]) => {
        const isActive = trips.some(t => t.origin === city || t.destination === city)
        if (!isActive) return null

        return (
          <Marker key={city} position={coords}>
            <Popup>{city}</Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}