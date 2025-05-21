
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Clock, Check, MapPin } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import OrderMap from '@/components/tracking/OrderMap';
import OrderStatus from '@/components/tracking/OrderStatus';
import OrderSummary from '@/components/tracking/OrderSummary';

const OrderTracking = () => {
  const navigate = useNavigate();
  const params = useParams();
  const [mapOpen, setMapOpen] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [routeCompleted, setRouteCompleted] = useState(false);
  const [mapStatic, setMapStatic] = useState(true);
  const [testMode, setTestMode] = useState(false);
  
  const order = {
    id: params.orderId || '#ORD123456',
    status: 'in_transit',
    createdAt: new Date().toISOString(),
    estimatedTime: 25,
    items: [
      { name: 'X-Burguer', quantity: 2, price: 15.90, notes: 'Sem ketchup' },
      { name: 'Batata Frita', quantity: 1, price: 10.50 }
    ],
    total: 42.30,
  };

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'pending': return 0;
      case 'preparing': return 1;
      case 'ready': return 2;
      case 'in_transit': return 3;
      case 'delivered': return 4;
      default: return 0;
    }
  };

  const statusStep = getStatusStep(order.status);
  
  const handleTrackOrder = () => {
    setTracking(true);
    setMapOpen(true);
    setMapStatic(false);
    
    setTimeout(() => {
      if (tracking) {
        setRouteCompleted(true);
        setMapStatic(true);
        toast({
          title: "Entregador chegou ao destino",
          description: "Seu pedido foi entregue com sucesso!",
        });
      }
    }, 90000);
  };
  
  const handleTestTracking = () => {
    setTestMode(true);
    setTracking(true);
    setMapStatic(false);
    
    toast({
      title: "Modo de teste ativado",
      description: "Simulando rota de entrega por 90 segundos...",
    });
    
    setTimeout(() => {
      setTestMode(false);
      setRouteCompleted(true);
      setMapStatic(true);
      setTracking(false);
      
      toast({
        title: "Teste concluído",
        description: "A simulação de entrega foi finalizada.",
      });
    }, 90000);
  };
  
  const handleConfirmOrder = () => {
    setOrderConfirmed(true);
    toast({
      title: "Pedido confirmado",
      description: "Obrigado por confirmar o recebimento do seu pedido!",
    });
  };
  
  const handleRouteComplete = () => {
    if (testMode) {
      setRouteCompleted(true);
      setMapStatic(true);
      setTracking(false);
      setTestMode(false);
      
      toast({
        title: "Teste concluído",
        description: "A simulação de entrega foi finalizada com sucesso.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Button 
            variant="outline" 
            className="mb-4"
            onClick={() => navigate('/')}
          >
            Voltar ao menu
          </Button>
          
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Seu Pedido {order.id}</CardTitle>
                <ShoppingBag className="h-5 w-5 text-menu-primary" />
              </div>
              <CardDescription className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {new Date(order.createdAt).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <OrderStatus statusStep={statusStep} estimatedTime={order.estimatedTime} />
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Local de entrega</h3>
                  {(statusStep === 3 || statusStep === 4) && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleTestTracking}
                      disabled={tracking}
                      className="text-xs h-8"
                    >
                      Testar rastreio
                    </Button>
                  )}
                </div>
                {/* Ensure map is visible with a fixed height */}
                <div className="w-full h-[300px] relative">
                  <OrderMap 
                    isTracking={routeCompleted ? false : tracking} 
                    onRouteComplete={handleRouteComplete}
                    testMode={testMode}
                  />
                </div>
                
                {(statusStep === 3 || statusStep === 4) && (
                  <div className="space-y-3 pt-2">
                    <Button 
                      variant="outline" 
                      className="w-full flex items-center justify-center gap-2"
                      onClick={handleTrackOrder}
                      disabled={routeCompleted || tracking}
                    >
                      <MapPin className="h-4 w-4" />
                      {routeCompleted ? 'Rota concluída' : (tracking ? 'Rastreando...' : 'Rastrear pedido')}
                    </Button>
                    
                    <Button 
                      className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
                      onClick={handleConfirmOrder}
                      disabled={orderConfirmed}
                    >
                      <Check className="h-4 w-4" />
                      {orderConfirmed ? "Pedido confirmado" : "Confirmar recebimento"}
                    </Button>
                  </div>
                )}
              </div>
              
              <OrderSummary items={order.items} total={order.total} />
            </CardContent>
            
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.location.href = 'tel:+551199999999'}
              >
                Entrar em contato
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <Dialog open={mapOpen} onOpenChange={setMapOpen}>
        <DialogContent className="sm:max-w-md">
          <h2 className="text-lg font-medium mb-2">Rastreamento do pedido</h2>
          <div className="w-full h-[300px] relative">
            <OrderMap isTracking={tracking} onRouteComplete={handleRouteComplete} testMode={testMode} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderTracking;
