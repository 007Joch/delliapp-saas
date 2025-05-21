
import React from 'react';
import { CheckCircle, Clock, Loader2, Truck } from 'lucide-react';

interface OrderStatusProps {
  statusStep: number;
  estimatedTime: number;
}

const OrderStatus: React.FC<OrderStatusProps> = ({ statusStep, estimatedTime }) => {
  return (
    <div className="space-y-4">
      <h3 className="font-medium">Status do Pedido</h3>
      
      <div className="relative">
        {/* Linha de progresso */}
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200"></div>
        
        {/* Etapas */}
        <div className="relative flex justify-between">
          {/* Recebido */}
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${statusStep >= 0 ? 'border-menu-primary bg-menu-primary text-white' : 'border-gray-300 bg-white'}`}>
              {statusStep > 0 ? <CheckCircle className="w-5 h-5" /> : 1}
            </div>
            <span className="text-xs mt-1">Recebido</span>
          </div>
          
          {/* Preparando */}
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${statusStep >= 1 ? 'border-menu-primary bg-menu-primary text-white' : 'border-gray-300 bg-white'}`}>
              {statusStep > 1 ? <CheckCircle className="w-5 h-5" /> : statusStep === 1 ? <Loader2 className="w-5 h-5 animate-spin" /> : 2}
            </div>
            <span className="text-xs mt-1">Preparando</span>
          </div>
          
          {/* Pronto */}
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${statusStep >= 2 ? 'border-menu-primary bg-menu-primary text-white' : 'border-gray-300 bg-white'}`}>
              {statusStep > 2 ? <CheckCircle className="w-5 h-5" /> : 3}
            </div>
            <span className="text-xs mt-1">Pronto</span>
          </div>
          
          {/* Entregue */}
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${statusStep >= 3 ? 'border-menu-primary bg-menu-primary text-white' : 'border-gray-300 bg-white'}`}>
              {statusStep > 3 ? <CheckCircle className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
            </div>
            <span className="text-xs mt-1">Entregue</span>
          </div>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-yellow-50 rounded-md text-center">
        {statusStep === 0 && "Aguardando confirmação do restaurante..."}
        {statusStep === 1 && `Seu pedido está sendo preparado. Tempo estimado: ${estimatedTime} minutos.`}
        {statusStep === 2 && "Seu pedido está pronto e será entregue em breve!"}
        {statusStep === 3 && "Seu pedido está a caminho! Fique atento."}
        {statusStep === 4 && "Pedido entregue. Bom apetite!"}
      </div>
    </div>
  );
};

export default OrderStatus;
