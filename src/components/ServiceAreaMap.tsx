'use client'

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import { point, polygon as turfPolygon } from '@turf/helpers'

interface ServiceAreaMapProps {
  coordinates: [number, number] | null // [lng, lat]
  onServiceAreaCheck?: (inServiceArea: boolean, areaName: string | null) => void
}

interface GeoJSONFeature {
  type: 'Feature'
  properties: {
    name?: string
    type?: string
    style?: string
  }
  geometry: {
    type: 'Point' | 'Polygon'
    coordinates: number[] | number[][][]
  }
}

interface GeoJSONCollection {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

interface PolygonFeature {
  type: 'Feature'
  properties: {
    name?: string
    type?: string
    style?: string
  }
  geometry: {
    type: 'Polygon'
    coordinates: number[][][]
  }
}

// Color mapping from style property
function getPolygonColor(style: string | undefined): string {
  if (!style) return '#3388ff'
  // Extract color from style like "#poly-9C27B0-1200-179"
  const match = style.match(/#poly-([A-F0-9]{6})/i)
  return match ? `#${match[1]}` : '#3388ff'
}

export default function ServiceAreaMap({ coordinates, onServiceAreaCheck }: ServiceAreaMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const marker = useRef<maplibregl.Marker | null>(null)
  const [geoJsonData, setGeoJsonData] = useState<GeoJSONCollection | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  // Load GeoJSON data
  useEffect(() => {
    fetch('/service_areas.geojson')
      .then(res => res.json())
      .then((data: GeoJSONCollection) => setGeoJsonData(data))
      .catch(err => console.error('Failed to load service areas:', err))
  }, [])

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: [
              'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          }
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      },
      center: [134.0, -28.0], // Center of Australia
      zoom: 3.5
    })

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')

    map.current.on('load', () => {
      setMapLoaded(true)
    })

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Add service area polygons when data and map are ready
  useEffect(() => {
    if (!map.current || !mapLoaded || !geoJsonData) return

    // Filter to only polygon features with service_area type
    const serviceAreaPolygons = geoJsonData.features.filter(
      (f): f is PolygonFeature => f.geometry.type === 'Polygon' && f.properties?.type === 'service_area'
    )

    // Group polygons by color for efficient rendering
    const colorGroups: Record<string, PolygonFeature[]> = {}
    serviceAreaPolygons.forEach(polygon => {
      const color = getPolygonColor(polygon.properties?.style)
      if (!colorGroups[color]) colorGroups[color] = []
      colorGroups[color].push(polygon)
    })

    // Add each color group as a separate layer
    Object.entries(colorGroups).forEach(([color, polygons], index) => {
      const sourceId = `service-areas-${index}`
      const fillLayerId = `service-areas-fill-${index}`
      const lineLayerId = `service-areas-line-${index}`

      if (map.current?.getSource(sourceId)) return

      map.current?.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: polygons
        } as GeoJSON.FeatureCollection
      })

      map.current?.addLayer({
        id: fillLayerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': color,
          'fill-opacity': 0.25
        }
      })

      map.current?.addLayer({
        id: lineLayerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': color,
          'line-width': 2,
          'line-opacity': 0.8
        }
      })
    })
  }, [geoJsonData, mapLoaded])

  // Update marker and check service area when coordinates change
  useEffect(() => {
    if (!map.current || !coordinates) return

    const [lng, lat] = coordinates

    // Remove existing marker
    if (marker.current) {
      marker.current.remove()
    }

    // Add new marker
    marker.current = new maplibregl.Marker({ color: '#ff7a59' })
      .setLngLat([lng, lat])
      .addTo(map.current)

    // Fly to location
    map.current.flyTo({
      center: [lng, lat],
      zoom: 10,
      duration: 1500
    })

    // Check if point is in any service area
    if (geoJsonData && onServiceAreaCheck) {
      const testPoint = point([lng, lat])
      let foundArea: string | null = null

      for (const feature of geoJsonData.features) {
        if (feature.geometry.type === 'Polygon' && feature.properties?.type === 'service_area') {
          const coords = feature.geometry.coordinates as number[][][]
          const poly = turfPolygon(coords)
          if (booleanPointInPolygon(testPoint, poly)) {
            foundArea = feature.properties?.name || 'Unknown Area'
            break
          }
        }
      }

      onServiceAreaCheck(foundArea !== null, foundArea)
    }
  }, [coordinates, geoJsonData, onServiceAreaCheck])

  return (
    <div
      ref={mapContainer}
      className="w-full h-full"
      style={{ minHeight: '250px' }}
    />
  )
}
