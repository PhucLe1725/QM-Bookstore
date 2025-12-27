/**
 * AddressSelector Component
 * 
 * ⚠️ NOTE: This component currently uses GoongAPI directly from frontend.
 * TODO: Refactor to use backend APIs for:
 * - Place autocomplete
 * - Place detail
 * - Geocoding
 * - Direction/routing
 * 
 * See: /backend/SHIPPING-AND-GOONG-API-SPEC.md
 * 
 * For now, this component is kept as-is for address selection functionality.
 * Shipping calculation has been moved to backend via shippingService.
 */

import React, { useState, useEffect, useRef } from 'react'
import { MapPin } from 'lucide-react'
import { getStoreLocation, getConfigValue, CONFIG_KEYS } from '../utils/systemConfig'

const API_KEY = import.meta.env.GOONG_API_KEY || import.meta.env.VITE_GOONG_API_KEY
const MAPTILES_KEY = import.meta.env.GOONG_MAPTILES_KEY || import.meta.env.VITE_GOONG_MAPTILES_KEY

const AddressSelector = ({ onAddressChange, initialAddress = '' }) => {
  const [address, setAddress] = useState(initialAddress)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [storeLocation, setStoreLocation] = useState(null) // null cho đến khi fetch xong từ config
  const [storeName, setStoreName] = useState('Cửa hàng QM Bookstore')
  const [currentLocation, setCurrentLocation] = useState({
    lat: 21.028511,
    lng: 105.804817
  })
  const [distance, setDistance] = useState(null)
  const [duration, setDuration] = useState(null)
  
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const polylineRef = useRef(false)
  const timeoutRef = useRef(null)

  // Fetch store location on mount
  useEffect(() => {
    loadStoreLocation()
  }, [])

  // Initialize map after store location is loaded
  useEffect(() => {
    if (window.goongjs && mapRef.current && !mapInstanceRef.current && storeLocation) {
      initMap()
    }
  }, [storeLocation])

  const loadStoreLocation = async () => {
    try {
      const location = await getStoreLocation()
      const name = await getConfigValue(CONFIG_KEYS.STORE_NAME, 'Cửa hàng QM Bookstore')
      
      setStoreLocation(location)
      setStoreName(name)
      setCurrentLocation(location)
    } catch (error) {
      console.error('Error loading store location:', error)
      // Giữ giá trị mặc định
    }
  }

  const initMap = () => {
    window.goongjs.accessToken = MAPTILES_KEY
    
    mapInstanceRef.current = new window.goongjs.Map({
      container: mapRef.current,
      style: 'https://tiles.goong.io/assets/goong_map_web.json',
      center: [currentLocation.lng, currentLocation.lat],
      zoom: 13
    })

    // Add store marker (red)
    new window.goongjs.Marker({ color: '#FF0000' })
      .setLngLat([storeLocation.lng, storeLocation.lat])
      .setPopup(
        new window.goongjs.Popup().setHTML(
          `<strong>${storeName}</strong><br>Điểm xuất phát`
        )
      )
      .addTo(mapInstanceRef.current)

    // Add destination marker (blue, draggable) - Ban đầu ở vị trí store, sẽ update khi user chọn
    markerRef.current = new window.goongjs.Marker({ 
      draggable: true, 
      color: '#0066FF' 
    })
      .setLngLat([storeLocation.lng, storeLocation.lat])
    // Không add vào map ngay, sẽ add khi user click/chọn địa chỉ

    // Update on drag
    markerRef.current.on('dragend', () => {
      const lngLat = markerRef.current.getLngLat()
      handleLocationChange(lngLat.lat, lngLat.lng)
    })

    // Click to move marker
    mapInstanceRef.current.on('click', (e) => {
      const { lng, lat } = e.lngLat
      
      // Add marker to map nếu chưa có
      if (!markerRef.current._map) {
        markerRef.current.addTo(mapInstanceRef.current)
      }
      
      markerRef.current.setLngLat([lng, lat])
      handleLocationChange(lat, lng)
    })
  }

  const handleLocationChange = async (lat, lng) => {
    setCurrentLocation({ lat, lng })
    const newAddress = await reverseGeocode(lat, lng)
    if (newAddress) {
      await calculateRoute(lat, lng, newAddress)
    }
  }

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://rsapi.goong.io/Geocode?latlng=${lat},${lng}&api_key=${API_KEY}`
      )
      const data = await response.json()
      
      if (data.results && data.results[0]) {
        const formattedAddress = data.results[0].formatted_address
        setAddress(formattedAddress)
        return formattedAddress
      }
    } catch (err) {
      console.error('Reverse geocode error:', err)
    }
    return null
  }

  const calculateRoute = async (destLat, destLng, newAddress) => {
    try {
      const origin = `${storeLocation.lat},${storeLocation.lng}`
      const destination = `${destLat},${destLng}`
      
      const response = await fetch(
        `https://rsapi.goong.io/Direction?origin=${origin}&destination=${destination}&vehicle=car&api_key=${API_KEY}`
      )
      const data = await response.json()
      
      if (data.routes && data.routes[0]) {
        const leg = data.routes[0].legs[0]
        const distanceKm = (leg.distance.value / 1000).toFixed(2)
        const durationMin = Math.round(leg.duration.value / 60)
        
        setDistance(distanceKm)
        setDuration(durationMin)
        
        // Notify parent
        if (onAddressChange) {
          onAddressChange({
            address: newAddress,
            lat: destLat,
            lng: destLng,
            distance: distanceKm,
            duration: durationMin
          })
        }
        
        // Draw route
        drawRoute(data.routes[0].overview_polyline.points)
      }
    } catch (err) {
      console.error('Calculate route error:', err)
    }
  }

  const drawRoute = (encodedPolyline) => {
    if (!mapInstanceRef.current) return
    
    // Remove old route
    if (polylineRef.current) {
      if (mapInstanceRef.current.getLayer('route')) {
        mapInstanceRef.current.removeLayer('route')
      }
      if (mapInstanceRef.current.getSource('route')) {
        mapInstanceRef.current.removeSource('route')
      }
    }
    
    const coordinates = decodePolyline(encodedPolyline)
    
    mapInstanceRef.current.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: coordinates
        }
      }
    })
    
    mapInstanceRef.current.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#1e88e5',
        'line-width': 4
      }
    })
    
    polylineRef.current = true
    
  }

  const decodePolyline = (encoded) => {
    const points = []
    let index = 0, len = encoded.length
    let lat = 0, lng = 0
    
    while (index < len) {
      let b, shift = 0, result = 0
      do {
        b = encoded.charCodeAt(index++) - 63
        result |= (b & 0x1f) << shift
        shift += 5
      } while (b >= 0x20)
      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1))
      lat += dlat
      
      shift = 0
      result = 0
      do {
        b = encoded.charCodeAt(index++) - 63
        result |= (b & 0x1f) << shift
        shift += 5
      } while (b >= 0x20)
      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1))
      lng += dlng
      
      points.push([lng / 1e5, lat / 1e5])
    }
    
    return points
  }

  const handleSearchInput = (e) => {
    const value = e.target.value
    setAddress(value)
    
    clearTimeout(timeoutRef.current)
    
    if (!value.trim()) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    
    timeoutRef.current = setTimeout(() => {
      fetchSuggestions(value)
    }, 300)
  }

  const fetchSuggestions = async (query) => {
    try {
      const response = await fetch(
        `https://rsapi.goong.io/Place/AutoComplete?api_key=${API_KEY}&input=${encodeURIComponent(query)}`
      )
      const data = await response.json()
      
      if (data.predictions) {
        setSuggestions(data.predictions)
        setShowSuggestions(true)
      }
    } catch (err) {
      console.error('Fetch suggestions error:', err)
    }
  }

  const selectSuggestion = async (placeId, description) => {
    try {
      const response = await fetch(
        `https://rsapi.goong.io/Place/Detail?api_key=${API_KEY}&place_id=${placeId}`
      )
      const data = await response.json()
      
      if (data.result) {
        const { lat, lng } = data.result.geometry.location
        setAddress(description)
        setCurrentLocation({ lat, lng })
        setSuggestions([])
        setShowSuggestions(false)
        
        // Add marker to map nếu chưa có, sau đó update vị trí
        if (markerRef.current) {
          markerRef.current.setLngLat([lng, lat])
          if (!markerRef.current._map) {
            markerRef.current.addTo(mapInstanceRef.current)
          }
        }
        
        await calculateRoute(lat, lng, description)
      }
    } catch (err) {
      console.error('Select suggestion error:', err)
    }
  }

  return (
    <div className="space-y-4">
      {/* Address Input */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Địa chỉ giao hàng *
        </label>
        <div className="relative">
          <input
            type="text"
            value={address}
            onChange={handleSearchInput}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Nhập địa chỉ giao hàng..."
            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
        
        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => selectSuggestion(item.place_id, item.description)}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-b-0 transition-colors"
              >
                <div className="flex items-start">
                  <MapPin className="w-4 h-4 mr-2 mt-1 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{item.description}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map Container */}
      <div>
        <div 
          ref={mapRef} 
          className="w-full h-96 rounded-lg border border-gray-300"
        />
        <p className="text-xs text-gray-600 mt-2">
          💡 Click vào bản đồ để chọn vị trí chính xác hoặc kéo thả marker
        </p>
      </div>
    </div>
  )
}

export default AddressSelector

