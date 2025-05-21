
import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import DeliveryBikeSvg from './DeliveryBikeSvg';

// Configure Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoiMDA3am9jaCIsImEiOiJjbTk5ejE1eHMwYWY5MmlxNHpqM2YwdzY2In0.NIWCLXm9mhaIaTCMvbusNQ';

// Default locations
const DEFAULT_STORE_ADDRESS = {
  lat: -14.7952,
  lng: -39.2763, // Coordenadas para R. Nova, 325 - Califórnia, Itabuna - BA
  address: "R. Nova, 325 - Califórnia, Itabuna - BA, 45603-652"
};

const DEFAULT_CUSTOMER_ADDRESS = {
  lat: -14.8042,
  lng: -39.2697, // Coordenadas para Shopping Jequitibá, Itabuna - BA
  address: "Shopping Jequitibá, Av. Aziz Maron, s/n - Góes Calmon, Itabuna - BA, 45605-412"
};

interface OrderMapProps {
  isTracking?: boolean;
  onRouteComplete?: () => void;
  testMode?: boolean;
}

const OrderMap: React.FC<OrderMapProps> = ({ isTracking = false, onRouteComplete = () => {}, testMode = false }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const destinationMarker = useRef<mapboxgl.Marker | null>(null);
  const [loadingMap, setLoadingMap] = useState(true);
  const [route, setRoute] = useState([
    { ...DEFAULT_STORE_ADDRESS },  // Posição inicial (loja)
    { ...DEFAULT_CUSTOMER_ADDRESS } // Destino (cliente)
  ]);
  const [direction, setDirection] = useState(0);
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const animationRef = useRef<number | null>(null);
  const currentPositionRef = useRef<[number, number] | null>(null);
  const simulationSpeedRef = useRef(testMode ? 0.5 : 0.2); // Velocidade mais realista

  // Função para obter rota do Mapbox Directions API
  const fetchRouteCoordinates = async (
    start: [number, number], 
    end: [number, number]
  ) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`
      );
      
      const data = await response.json();
      if (!data.routes || data.routes.length === 0) {
        console.error('Nenhuma rota encontrada');
        return null;
      }
      
      return data.routes[0].geometry.coordinates;
    } catch (error) {
      console.error('Erro ao buscar rota:', error);
      return null;
    }
  };

  // Função para adicionar ou atualizar a rota no mapa
  const updateRouteOnMap = (coordinates: any[]) => {
    if (!map.current) return;

    const routeGeoJSON = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates
      }
    };
    
    // Adicionar ou atualizar fonte da rota
    if (map.current.getSource('route')) {
      // Atualizar fonte existente
      (map.current.getSource('route') as mapboxgl.GeoJSONSource).setData(routeGeoJSON as any);
    } else {
      // Adicionar nova fonte e camada
      map.current.addSource('route', {
        type: 'geojson',
        data: routeGeoJSON as any
      });
      
      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#4285F4',
          'line-width': 5,
          'line-opacity': 0.75
        }
      });
    }
  };

  // Função para recalcular a rota com base na posição atual
  const recalculateRoute = async () => {
    if (!currentPositionRef.current) return;
    
    // Obter coordenadas atualizadas da posição atual até o destino
    const endPoint: [number, number] = [route[1].lng, route[1].lat];
    const newCoordinates = await fetchRouteCoordinates(
      currentPositionRef.current,
      endPoint
    );
    
    if (newCoordinates) {
      setRouteCoordinates(newCoordinates);
      updateRouteOnMap(newCoordinates);
      return newCoordinates;
    }
    
    return null;
  };

  // Simular desvio de rota a cada 10 segundos (apenas no modo de teste)
  useEffect(() => {
    if (!testMode || !isTracking) return;
    
    const deviationInterval = setInterval(() => {
      if (currentPositionRef.current) {
        // Simular um pequeno desvio aleatório da rota
        const randomDeviation = 0.0002; // Pequeno desvio para simular mudança de rota
        const deviatedPosition: [number, number] = [
          currentPositionRef.current[0] + (Math.random() * randomDeviation - randomDeviation/2),
          currentPositionRef.current[1] + (Math.random() * randomDeviation - randomDeviation/2)
        ];
        
        // Atualizar posição atual e recalcular
        currentPositionRef.current = deviatedPosition;
        
        // Atualizar marcador
        if (marker.current) {
          marker.current.setLngLat(deviatedPosition);
        }
        
        // Recalcular rota
        recalculateRoute();
      }
    }, 10000); // Recalcular a cada 10 segundos
    
    return () => {
      clearInterval(deviationInterval);
    };
  }, [testMode, isTracking]);

  // Initialize the map
  useEffect(() => {
    if (!mapContainer.current) return;

    // Create map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [DEFAULT_STORE_ADDRESS.lng, DEFAULT_STORE_ADDRESS.lat],
      zoom: 15,
      pitch: 45,
      maxZoom: 17, // Limitar o zoom máximo
      minZoom: 13, // Limitar o zoom mínimo
    });

    // Desabilitar rotação do mapa para uma experiência mais simples
    map.current.dragRotate.disable();
    map.current.touchZoomRotate.disableRotation();

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl({
      showCompass: false // Esconder a bússola
    }), 'top-right');

    // Criar elemento personalizado para o marcador do motoboy (usando SVG)
    const bikeElement = document.createElement('div');
    bikeElement.className = 'delivery-bike-marker';
    bikeElement.innerHTML = `<div class="bike-wrapper"></div>`;
    
    // Adiciona SVG direto ao elemento
    const bikeWrapper = bikeElement.querySelector('.bike-wrapper');
    if (bikeWrapper) {
      const svg = document.createElement('div');
      // Renderiza o componente DeliveryBikeSvg como HTML
      svg.innerHTML = `
        <svg width="48" height="48" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="256" cy="460" rx="120" ry="20" fill="rgba(0,0,0,0.2)" />
          <path d="M170 380 L340 380 L360 430 L150 430" fill="#ff1744" />
          <path d="M200 430 L310 430 L290 460 L220 460" fill="#333333" />
          <circle cx="180" cy="440" r="30" fill="#333333" stroke="#555555" strokeWidth="4" />
          <circle cx="330" cy="440" r="30" fill="#333333" stroke="#555555" strokeWidth="4" />
          <circle cx="180" cy="440" r="15" fill="#555555" />
          <circle cx="330" cy="440" r="15" fill="#555555" />
          <path d="M210 380 L300 380 L290 300 L220 300" fill="#78909c" />
          <path d="M220 300 L290 300 L280 230 L230 230" fill="#78909c" />
          <path d="M280 230 L230 230 L240 160 L270 160" fill="#78909c" />
          <path d="M290 280 L340 250" stroke="#78909c" strokeWidth="20" strokeLinecap="round" />
          <path d="M220 280 L170 250" stroke="#78909c" strokeWidth="20" strokeLinecap="round" />
          <rect x="155" y="240" width="30" height="20" rx="5" fill="#333333" />
          <rect x="325" y="240" width="30" height="20" rx="5" fill="#333333" />
          <path d="M140 240 L155 250" stroke="#e57373" strokeWidth="20" strokeLinecap="round" />
          <path d="M355 240 L340 250" stroke="#e57373" strokeWidth="20" strokeLinecap="round" />
          <circle cx="255" cy="140" r="40" fill="#333333" />
          <path d="M215 140 L295 140 L285 190 L225 190 Z" fill="#ff1744" />
          <path d="M235 140 L275 140 L265 110 L245 110 Z" fill="#ff1744" />
          <ellipse cx="255" cy="140" rx="25" ry="15" fill="white" />
          <rect x="210" y="350" width="90" height="70" rx="5" fill="#deb887" />
          <path d="M210 350 L300 350 L270 380 L240 380 Z" fill="#c19a6b" />
        </svg>
      `;
      bikeWrapper.appendChild(svg);
    }

    // Create destination marker
    const destElement = document.createElement('div');
    destElement.className = 'destination-marker';
    destElement.innerHTML = `<div class="pulse"></div>
      <svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.382 0 0 5.382 0 12C0 20 12 36 12 36C12 36 24 20 24 12C24 5.382 18.618 0 12 0ZM12 16C9.791 16 8 14.209 8 12C8 9.791 9.791 8 12 8C14.209 8 16 9.791 16 12C16 14.209 14.209 16 12 16Z" fill="#E53935"/>
      </svg>`;

    // Add style for pulse animation and markers
    const style = document.createElement('style');
    style.innerHTML = `
      .delivery-bike-marker {
        width: 48px;
        height: 48px;
        position: relative;
        top: -24px;
        left: -24px;
        z-index: 1000;
      }
      
      .bike-wrapper {
        width: 100%;
        height: 100%;
        transform-origin: center center;
      }
      
      .destination-marker {
        position: relative;
        top: -36px;
        left: -12px;
      }
      
      .pulse {
        display: block;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: rgba(229, 57, 53, 0.4);
        position: absolute;
        top: 0;
        left: 1px;
        animation: pulse 1.5s ease-out infinite;
        transform-origin: center center;
      }

      @keyframes pulse {
        0% {
          transform: scale(0.1);
          opacity: 0;
        }
        50% {
          opacity: 1;
        }
        100% {
          transform: scale(1.2);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);

    // Add markers with proper offset para melhor alinhamento com a rua
    marker.current = new mapboxgl.Marker({
      element: bikeElement,
      anchor: 'center', // Importante para manter o motoboy centrado na rota
      offset: [0, 0] // Ajustar offset para melhor alinhamento com a rua
    })
      .setLngLat([route[0].lng, route[0].lat])
      .addTo(map.current);
      
    currentPositionRef.current = [route[0].lng, route[0].lat];

    destinationMarker.current = new mapboxgl.Marker({
      element: destElement
    })
      .setLngLat([route[1].lng, route[1].lat])
      .addTo(map.current);

    // Add store popup
    const storePopup = new mapboxgl.Popup({
      closeButton: false,
      offset: 25
    })
      .setHTML('<div class="p-2 bg-white rounded"><strong>Restaurante</strong><br>Origem do pedido</div>');

    const storeMarker = new mapboxgl.Marker({
      color: '#3FB1CE'
    })
      .setLngLat([route[0].lng, route[0].lat])
      .setPopup(storePopup)
      .addTo(map.current);

    // Add destination popup
    const destPopup = new mapboxgl.Popup({
      closeButton: false,
      offset: 25
    })
      .setHTML('<div class="p-2 bg-white rounded"><strong>Seu endereço</strong><br>Destino da entrega</div>');
      
    destinationMarker.current.setPopup(destPopup);

    // Get initial route
    const getInitialRoute = async () => {
      const coordinates = await fetchRouteCoordinates(
        [route[0].lng, route[0].lat],
        [route[1].lng, route[1].lat]
      );
      
      if (coordinates) {
        setRouteCoordinates(coordinates);
        updateRouteOnMap(coordinates);
      }
    };

    // When map is loaded
    map.current.on('load', () => {
      setLoadingMap(false);
      getInitialRoute();
      
      // Fit map to show both markers com padding otimizado
      const bounds = new mapboxgl.LngLatBounds()
        .extend([route[0].lng, route[0].lat])
        .extend([route[1].lng, route[1].lat]);
        
      map.current?.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        maxZoom: 15 // Limitar o zoom quando está calculando a área visível
      });
    });

    // Cleanup function
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  // Animation effect for tracking
  useEffect(() => {
    if (!isTracking || !map.current || !marker.current || routeCoordinates.length === 0) return;

    let stepProgress = 0;
    let currentSegment = 0;
    
    // Função para animar ao longo da rota de forma mais suave
    const animateAlongRoute = () => {
      if (currentSegment >= routeCoordinates.length - 1) {
        if (testMode) {
          onRouteComplete();
        }
        return;
      }
      
      // Obter ponto atual e próximo
      const currentPoint = routeCoordinates[currentSegment];
      const nextPoint = routeCoordinates[currentSegment + 1];
      
      if (!currentPoint || !nextPoint) return;
      
      // Calcular posição intermediária com base no progresso
      const lng = currentPoint[0] + (nextPoint[0] - currentPoint[0]) * stepProgress;
      const lat = currentPoint[1] + (nextPoint[1] - currentPoint[1]) * stepProgress;
      
      // Atualizar marcador
      if (marker.current) {
        marker.current.setLngLat([lng, lat]);
        currentPositionRef.current = [lng, lat];
        
        // Calcular direção
        const dx = nextPoint[0] - currentPoint[0];
        const dy = nextPoint[1] - currentPoint[1];
        if (dx !== 0 || dy !== 0) { // Evitar divisão por zero
          const rotation = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
          setDirection(rotation);
          
          // Atualizar rotação da imagem do motoboy
          const markerEl = marker.current.getElement();
          const bikeWrapper = markerEl.querySelector('.bike-wrapper') as HTMLElement;
          if (bikeWrapper) {
            bikeWrapper.style.transform = `rotate(${rotation}deg)`;
          }
        }
      }
      
      // Centralizar mapa na posição atual com transição mais fluida e suave
      // Ajuste para menor frequência de centralização para evitar problemas de animação
      if (currentSegment % 5 === 0) { // Reduzido para menos atualizações de visualização
        map.current?.easeTo({ 
          center: [lng, lat], 
          duration: 2000, // Transição mais lenta para animação mais suave
          essential: true,
          easing: (t) => {
            return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // Curva de easing personalizada
          }
        });
      }
      
      // Incrementar progresso de forma mais lenta para animação mais realista
      stepProgress += simulationSpeedRef.current * 0.002; // Ainda mais lento e realista
      
      // Se completou o segmento atual, avance para o próximo
      if (stepProgress >= 1) {
        currentSegment++;
        stepProgress = 0;
      }
      
      // Continuar animação
      animationRef.current = requestAnimationFrame(animateAlongRoute);
    };
    
    // Iniciar animação
    animationRef.current = requestAnimationFrame(animateAlongRoute);
    
    // Limpar na desmontagem
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isTracking, routeCoordinates, testMode, onRouteComplete]);

  return (
    <div className="w-full h-[300px] bg-gray-100 rounded-lg overflow-hidden">
      <div className="w-full h-full relative">
        <div 
          ref={mapContainer} 
          className="absolute inset-0"
        />
        {loadingMap && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <Loader2 className="h-8 w-8 animate-spin text-menu-primary" />
          </div>
        )}
      </div>
      <div className="p-2 bg-yellow-50 text-center">
        <p className="text-xs">{isTracking 
          ? "Acompanhando em tempo real a localização do entregador." 
          : "Essa é uma versão demonstrativa do mapa. Na versão final, a localização em tempo real do entregador será mostrada."}</p>
      </div>
    </div>
  );
};

export default OrderMap;
