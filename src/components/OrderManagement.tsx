import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Clock, User, Utensils, RefreshCw } from 'lucide-react';
import { useUserSwitcher } from '@/context/UserSwitcherContext';
import { Dialog } from '@/components/ui/dialog';
import OrderDetailsDialog from '@/components/OrderDetailsDialog';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Dados de exemplo - futuramente virão da API
const mockOrders = [
  // Removidos os pedidos mockados para evitar que apareçam automaticamente após limpar todos os pedidos
];

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  notes?: string;
  image?: string;
  product_id: number;
}

interface OrderProps {
  id: number;
  table: string;
  table_name?: string;
  status: string;
  items: OrderItem[];
  total: number;
  createdAt: string;
  assignedTo: string | null;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'preparing':
      return 'bg-blue-100 text-blue-800';
    case 'ready':
      return 'bg-green-100 text-green-800';
    case 'delivered':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending':
      return 'Pendente';
    case 'preparing':
      return 'Em preparo';
    case 'ready':
      return 'Pronto';
    case 'delivered':
      return 'Entregue';
    default:
      return 'Desconhecido';
  }
};

const OrderManagement = () => {
  const { currentUser } = useUserSwitcher();
  const [orders, setOrders] = useState(mockOrders);
  const [selectedOrder, setSelectedOrder] = useState<typeof mockOrders[0] | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();
  
  const isStaff = ['admin', 'restaurant_owner', 'waiter', 'chef'].includes(currentUser?.role || '');

  // Carregar pedidos do Supabase ao iniciar
  useEffect(() => {
    fetchOrdersFromSupabase();
  }, []);

  const fetchOrdersFromSupabase = async () => {
    try {
      // Buscar todos os pedidos do Supabase, sem filtrar por status específico
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*');
      
      if (ordersError) throw ordersError;
      
      const orderIds = ordersData.map(o => o.id);
      
      // Se não houver pedidos, inicializar com array vazio
      if (orderIds.length === 0) {
        setOrders([]);
        return;
      }
      
      // Buscar os itens de cada pedido
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('order_id, quantity, price, notes, product_id')
        .in('order_id', orderIds);
      
      if (itemsError) throw itemsError;
      
      // Buscar informações dos produtos para obter nomes e imagens
      const productIds = Array.from(new Set(itemsData.map(item => item.product_id)));
      
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, image_url, price')
        .in('id', productIds);
      
      if (productsError) throw productsError;
      
      // Criar um mapa de produtos para fácil acesso
      const productMap: Record<number, {name: string; image_url?: string; price: number}> = {};
      productsData?.forEach(p => { productMap[p.id] = p; });
      
      // Mapear os pedidos com seus itens completos
      const processedOrders = ordersData.map(order => {
        // Filtrar itens deste pedido
        const orderItems = itemsData
          .filter(item => item.order_id === order.id)
          .map(item => ({
            name: productMap[item.product_id]?.name || 'Produto Desconhecido',
            quantity: item.quantity,
            price: item.price || productMap[item.product_id]?.price || 0,
            notes: item.notes || undefined,
            image: productMap[item.product_id]?.image_url || undefined,
            product_id: item.product_id
          }));
        
        // Calcular o total do pedido
        const total = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        return {
          ...order,
          items: orderItems,
          total: total
        };
      });
      
      setOrders(processedOrders);
      
    } catch (error) {
      console.error('Erro ao buscar pedidos do Supabase:', error);
      toast({
        title: 'Erro ao carregar pedidos',
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive'
      });
    }
  };
  
  // Função de fallback para carregar pedidos do localStorage
  const loadOrders = () => {
    const storedOrders = localStorage.getItem('tableOrders');
    if (storedOrders) {
      try {
        const parsedOrders = JSON.parse(storedOrders);
        // Substitui completamente os pedidos em vez de combinar com os predefinidos
        setOrders(parsedOrders);
      } catch (error) {
        console.error('Erro ao carregar pedidos:', error);
      }
    } else {
      // Se não houver pedidos no localStorage, inicializa com array vazio
      setOrders([]);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Buscar dados atualizados do Supabase
    fetchOrdersFromSupabase().then(() => {
      toast({
        title: "Atualizado",
        description: "Lista de pedidos atualizada com sucesso",
      });
      setIsRefreshing(false);
    }).catch(() => {
      setIsRefreshing(false);
    });
  };

  const handleDeleteAll = async () => {
    try {
      await supabase.from('order_items').delete().gt('id', 0);
      await supabase.from('orders').delete().gt('id', 0);
      localStorage.removeItem('tableOrders');
      setOrders([]);
      toast({
        title: "Todos os pedidos apagados",
        description: "Todos os pedidos foram removidos com sucesso",
      });
    } catch (error) {
      console.error("Erro ao apagar pedidos:", error);
      toast({
        title: "Erro ao apagar pedidos",
        description: error instanceof Error ? error.message : "Falha ao limpar pedidos",
        variant: "destructive",
      });
    }
  };

  // Se não for funcionário, mostrar mensagem de acesso negado
  if (!isStaff) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="container mx-auto px-4 py-8">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Acesso restrito</CardTitle>
              <CardDescription>
                Você não tem permissão para acessar esta página
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">
                Esta página é destinada apenas para funcionários do restaurante.
              </p>
              <Button className="mt-4" onClick={() => navigate('/')}>
                Voltar para o início
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  const handleAssignTable = (orderId: number) => {
    if (!currentUser) return;
    
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId 
          ? { ...order, assignedTo: currentUser.name } 
          : order
      )
    );
    
    toast({
      title: "Mesa assumida com sucesso",
      description: `Você é o responsável por ${orders.find(o => o.id === orderId)?.table_name || orders.find(o => o.id === orderId)?.table}`,
    });
  };
  
  const handleOpenDetails = (order: typeof orders[0]) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };
  
  const handleKitchenManagement = () => {
    navigate('/kitchen-management');
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Gerenciamento de Pedidos / Mesas</h1>
            <Button 
              size="icon"
              variant="outline"
              onClick={handleRefresh}
              className="rounded-full h-8 w-8"
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {['admin', 'restaurant_owner'].includes(currentUser?.role || '') && (
              <Button variant="destructive" onClick={handleDeleteAll}>
                Apagar todos os pedidos
              </Button>
            )}
            {['admin', 'restaurant_owner', 'chef'].includes(currentUser?.role || '') && (
              <Button onClick={handleKitchenManagement}>
                Acessar Cozinha
              </Button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map(order => (
            <Card key={order.id} className="overflow-hidden">
              <div className={`h-2 ${order.status === 'pending' ? 'bg-yellow-500' : order.status === 'preparing' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle>{order.table_name || order.table}</CardTitle>
                  <Badge className={getStatusColor(order.status)}>
                    {getStatusText(order.status)}
                  </Badge>
                </div>
                <CardDescription className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {new Date(order.createdAt).toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </CardDescription>
                {order.assignedTo ? (
                  <div className="mt-1 text-sm flex items-center gap-1 text-gray-600">
                    <User className="w-4 h-4" />
                    <span>Atendido por: {order.assignedTo}</span>
                  </div>
                ) : (
                  <div className="mt-1 text-sm flex items-center gap-1 text-yellow-600">
                    <User className="w-4 h-4" />
                    <span>Atendimento pendente</span>
                  </div>
                )}
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Itens</h4>
                    <ul className="space-y-2">
                      {order.items.map((item, index) => (
                        <li key={index} className="flex flex-col text-sm">
                          <div className="flex justify-between">
                            <span>{item.quantity}x {item.name}</span>
                            <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                          {item.notes && (
                            <p className="text-sm text-red-500 italic mt-1">{item.notes}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span>R$ {order.total.toFixed(2)}</span>
                  </div>
                  
                  <div className="pt-3 space-y-2">
                    {currentUser?.role === 'waiter' && (
                      <>
                        <Button 
                          className="w-full" 
                          variant={order.status === 'ready' ? 'default' : 'outline'}
                          onClick={() => order.assignedTo ? handleOpenDetails(order) : handleAssignTable(order.id)}
                        >
                          {!order.assignedTo ? 'Assumir mesa' : order.status === 'ready' ? 'Entregar pedido' : 'Verificar status'}
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => handleOpenDetails(order)}
                        >
                          Ver detalhes
                        </Button>
                      </>
                    )}
                    
                    {currentUser?.role === 'chef' && (
                      <div className="space-y-2">
                        <Button 
                          className="w-full" 
                          variant={order.status === 'pending' ? 'default' : 'outline'}
                          onClick={handleKitchenManagement}
                        >
                          {order.status === 'pending' ? 'Iniciar preparo' : 
                           order.status === 'preparing' ? 'Marcar como pronto' : 'Ver detalhes'}
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => handleOpenDetails(order)}
                        >
                          Ver detalhes
                        </Button>
                      </div>
                    )}
                    
                    {(currentUser?.role === 'admin' || currentUser?.role === 'restaurant_owner') && (
                      <div className="space-y-2">
                        <Button 
                          className="w-full"
                          onClick={() => !order.assignedTo ? handleAssignTable(order.id) : handleOpenDetails(order)}
                        >
                          {!order.assignedTo ? 'Assumir mesa' : 'Alterar status'}
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => handleOpenDetails(order)}
                        >
                          Ver detalhes
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {selectedOrder && (
        <OrderDetailsDialog 
          order={selectedOrder}
          open={showDetails}
          onOpenChange={setShowDetails}
          currentUserRole={currentUser?.role || ''}
        />
      )}
    </div>
  );
};

export default OrderManagement;
