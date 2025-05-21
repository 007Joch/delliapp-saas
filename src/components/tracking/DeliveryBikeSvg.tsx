
import React from 'react';

interface DeliveryBikeSvgProps {
  direction?: number;
}

const DeliveryBikeSvg: React.FC<DeliveryBikeSvgProps> = ({ direction = 0 }) => (
  <svg 
    width="48" 
    height="48" 
    viewBox="0 0 512 512" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ 
      transform: `rotate(${direction}deg)`,
      transformOrigin: 'center center'
    }}
  >
    {/* Sombra sob o motoboy */}
    <ellipse cx="256" cy="460" rx="120" ry="20" fill="rgba(0,0,0,0.2)" />
    
    {/* Moto (base vermelha) */}
    <path d="M170 380 L340 380 L360 430 L150 430" fill="#ff1744" />
    <path d="M200 430 L310 430 L290 460 L220 460" fill="#333333" />
    
    {/* Rodas */}
    <circle cx="180" cy="440" r="30" fill="#333333" stroke="#555555" strokeWidth="4" />
    <circle cx="330" cy="440" r="30" fill="#333333" stroke="#555555" strokeWidth="4" />
    <circle cx="180" cy="440" r="15" fill="#555555" />
    <circle cx="330" cy="440" r="15" fill="#555555" />
    
    {/* Corpo do motoboy */}
    <path d="M210 380 L300 380 L290 300 L220 300" fill="#78909c" />
    <path d="M220 300 L290 300 L280 230 L230 230" fill="#78909c" />
    <path d="M280 230 L230 230 L240 160 L270 160" fill="#78909c" />
    
    {/* Braços */}
    <path d="M290 280 L340 250" stroke="#78909c" strokeWidth="20" strokeLinecap="round" />
    <path d="M220 280 L170 250" stroke="#78909c" strokeWidth="20" strokeLinecap="round" />
    <rect x="155" y="240" width="30" height="20" rx="5" fill="#333333" />
    <rect x="325" y="240" width="30" height="20" rx="5" fill="#333333" />
    <path d="M140 240 L155 250" stroke="#e57373" strokeWidth="20" strokeLinecap="round" />
    <path d="M355 240 L340 250" stroke="#e57373" strokeWidth="20" strokeLinecap="round" />
    
    {/* Cabeça e capacete */}
    <circle cx="255" cy="140" r="40" fill="#333333" />
    <path d="M215 140 L295 140 L285 190 L225 190 Z" fill="#ff1744" />
    <path d="M235 140 L275 140 L265 110 L245 110 Z" fill="#ff1744" />
    <ellipse cx="255" cy="140" rx="25" ry="15" fill="white" />
    
    {/* Caixa de entrega */}
    <rect x="210" y="350" width="90" height="70" rx="5" fill="#deb887" />
    <path d="M210 350 L300 350 L270 380 L240 380 Z" fill="#c19a6b" />
  </svg>
);

export default DeliveryBikeSvg;
