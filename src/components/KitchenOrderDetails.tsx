import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ClipboardList, Phone, MapPin, CircleAlert } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  notes?: string;
  image?: string;
}

interface OrderProps {
  id: number;
  table?: string;
  table_name?: string;
  status: string;
  items: OrderItem[];
  total: number;
  createdAt: string;
  assignedTo: string | null;
  isDelivery?: boolean;
  customer?: {
    name?: string;
    phone?: string;
    address?: string;
  };
  deliveryFee?: number;
}

interface KitchenOrderDetailsProps {
  order: OrderProps;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartPreparation?: (orderId: number) => void;
  onFinishPreparation?: (orderId: number) => void;
  onCancelOrder?: (orderId: number) => void;
}

const KitchenOrderDetails: React.FC<KitchenOrderDetailsProps> = ({
  order,
  open,
  onOpenChange,
  onStartPreparation,
  onFinishPreparation,
  onCancelOrder
}) => {
  const [currentStatus, setCurrentStatus] = useState(order.status);
  
  // Item placeholders - em produção isso viria de um banco de imagens
  const itemPlaceholders = [
    "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9",
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38"
  ];

  const handleStartPreparation = () => {
    if (onStartPreparation) {
      onStartPreparation(order.id);
    }
    setCurrentStatus('in_progress');
    toast({
      title: "Preparo iniciado",
      description: `Você começou a preparar o pedido #${order.id}`
    });
  };

  const handleFinishPreparation = () => {
    if (onFinishPreparation) {
      onFinishPreparation(order.id);
    }
    setCurrentStatus('ready');
    toast({
      title: "Pedido pronto",
      description: `O pedido #${order.id} está pronto para entrega`
    });
  };

  const handleCancelOrder = () => {
    if (onCancelOrder) {
      onCancelOrder(order.id);
    }
    onOpenChange(false);
    toast({
      title: "Pedido cancelado",
      description: `O pedido #${order.id} foi cancelado`,
      variant: "destructive"
    });
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'queued':
      case 'pending':
        return 'Pendente';
      case 'in_progress':
        return 'Em preparo';
      case 'ready':
        return 'Pronto';
      case 'delivered':
        return 'Entregue';
      default:
        return 'Desconhecido';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // Se for hoje, mostrar "há X minutos/horas"
    if (date.toDateString() === now.toDateString()) {
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.round(diffMs / 60000);
      
      if (diffMins < 1) return 'agora mesmo';
      if (diffMins < 60) return `há ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
      
      const diffHours = Math.floor(diffMins / 60);
      return `há ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
    }
    
    // Se for outro dia, mostrar a data
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const subtotal = order.total - (order.deliveryFee || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(currentStatus)}>
                {getStatusText(currentStatus)}
              </Badge>
              <DialogTitle className="text-2xl flex items-center gap-2">
                {order.isDelivery ? 'Pedido Delivery' : (order.table_name || order.table || 'Mesa')}
                {order.isDelivery && (
                  <Badge className="bg-indigo-100 text-indigo-800">Delivery</Badge>
                )}
              </DialogTitle>
            </div>
            <span className="text-sm text-gray-500">
              {formatTime(order.createdAt)}
            </span>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Coluna da esquerda - Itens do Pedido */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList className="h-5 w-5 text-gray-600" />
              <h2 className="text-xl font-semibold">Itens do Pedido</h2>
            </div>

            <div className="space-y-5 max-h-[300px] overflow-y-auto pr-2">
              {order.items.map((item, index) => (
                <div key={index} className="flex gap-3">
                  <div className="w-16 h-16 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                    <img
                      src={item.image || itemPlaceholders[index % itemPlaceholders.length]}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div>
                        {item.quantity > 1 && (
                          <span className="font-medium text-lg mr-1">{item.quantity}x</span>
                        )}
                        <span className="font-semibold">{item.name}</span>
                      </div>
                      <span className="font-medium">R$ {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                    {item.notes && (
                      <p className="text-sm text-red-500 italic mt-1">{item.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <Separator className="my-4" />
            
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>
              
              {order.isDelivery && order.deliveryFee && (
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">Taxa de entrega</span>
                  <span>R$ {order.deliveryFee.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between font-bold text-lg mt-2">
                <span>Total</span>
                <span>R$ {order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          {/* Coluna da direita - Detalhes do Cliente */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              {order.customer ? (
                <>
                  <Badge className="bg-indigo-100 text-indigo-800 px-2 py-1">Delivery</Badge>
                  <h2 className="text-xl font-semibold">Detalhes do Cliente</h2>
                </>
              ) : (
                <>
                  <Badge className="bg-blue-100 text-blue-800 px-2 py-1">Cliente local</Badge>
                  <h2 className="text-xl font-semibold">{order.table_name || order.table || 'Mesa'}</h2>
                </>
              )}
            </div>
            
            {order.customer ? (
              <div className="space-y-3 bg-gray-50 p-4 rounded-md">
                <div>
                  <h3 className="font-medium">{order.customer.name}</h3>
                </div>
                
                {order.customer.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-600" />
                    <span>{order.customer.phone}</span>
                  </div>
                )}
                
                {order.customer.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-600 mt-1" />
                    <span>{order.customer.address}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-md">
                <p>Cliente em loja: {order.table_name || order.table || 'Mesa'}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Pedido para consumo no local.
                </p>
              </div>
            )}
            
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-4">
                <CircleAlert className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold">Status do Pedido</h2>
              </div>
              
              <Badge className={`${getStatusColor(currentStatus)} text-base px-3 py-1`}>
                {getStatusText(currentStatus)}
              </Badge>
              
              {order.assignedTo && (
                <p className="mt-2 text-sm text-gray-600">
                  Atribuído a: <span className="font-semibold">{order.assignedTo}</span>
                </p>
              )}
            </div>

            <div className="mt-6 space-y-3">
              {(currentStatus === 'queued' || currentStatus === 'pending') && (
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={handleStartPreparation}
                >
                  Iniciar preparo
                </Button>
              )}
              
              {currentStatus === 'in_progress' && (
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={handleFinishPreparation}
                >
                  Marcar como pronto
                </Button>
              )}
              
              <Button 
                variant="destructive" 
                className="w-full" 
                onClick={handleCancelOrder}
              >
                Cancelar pedido
              </Button>
            </div>
          </div>
        </div>
        
        {/* Mostrar ID do pedido */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <ClipboardList className="h-4 w-4" />
          <span>Pedido #{order.id}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KitchenOrderDetails;
