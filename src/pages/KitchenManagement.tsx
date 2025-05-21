import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, UtensilsCrossed, CheckCircle, ClipboardList, Filter } from 'lucide-react';
import { useUserSwitcher } from '@/context/UserSwitcherContext';
import { toast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import KitchenOrderDetails from '@/components/KitchenOrderDetails';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

const KitchenManagement = () => {
  const { currentUser } = useUserSwitcher();
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('preparing');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [queueFilter, setQueueFilter] = useState<'all' | 'store' | 'delivery'>('all');
  const [inProgressFilter, setInProgressFilter] = useState<'all' | 'store' | 'delivery'>('all');
  const [readyFilter, setReadyFilter] = useState<'all' | 'store' | 'delivery'>('all');
  const [pickedUpFilter, setPickedUpFilter] = useState<'all' | 'store' | 'delivery'>('all');
  const navigate = useNavigate();
  
  const isKitchenStaff = ['admin', 'restaurant_owner', 'chef'].includes(currentUser?.role || '');

  // Se não for funcionário da cozinha, mostrar mensagem de acesso negado
  if (!isKitchenStaff) {
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
                Esta página é destinada apenas para funcionários da cozinha.
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
  
  const handleStartPreparation = (orderId: number) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId
          ? { ...order, status: 'in_progress', assignedTo: currentUser?.name || null }
          : order
      )
    );
    
    const orderTable = orders.find(o => o.id === orderId)?.table;
    toast({
      title: "Preparo iniciado",
      description: `Você começou a preparar o pedido de ${orderTable}`,
    });
    
    // Fechar o modal se estiver aberto
    setDetailsOpen(false);
  };
  
  const handleFinishPreparation = (orderId: number) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId
          ? { ...order, status: 'ready' }
          : order
      )
    );
    
    const orderTable = orders.find(o => o.id === orderId)?.table;
    toast({
      title: "Pedido pronto",
      description: `O pedido de ${orderTable} está pronto para entrega`,
    });
    
    // Fechar o modal se estiver aberto
    setDetailsOpen(false);
  };
  
  const handlePickedUp = (orderId: number) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId
          ? { ...order, status: 'picked_up' }
          : order
      )
    );
    
    const orderTable = orders.find(o => o.id === orderId)?.table;
    toast({
      title: "Pedido retirado",
      description: `O pedido de ${orderTable} foi retirado com sucesso`,
    });
  };
  
  const handleOpenDetails = async (order: typeof orders[0]) => {
    try {
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('order_id, quantity, price, notes, product_id')
        .eq('order_id', order.id);
      if (itemsError || !itemsData) throw itemsError;
      const productIds = Array.from(new Set(itemsData.map(item => item.product_id)));
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, image_url')
        .in('id', productIds);
      if (productsError || !productsData) throw productsError;
      const productMap: Record<number, { name: string; image_url?: string }> = {};
      productsData.forEach(p => { productMap[p.id] = { name: p.name, image_url: p.image_url ?? undefined }; });
      const fetchedItems = itemsData.map(item => ({
        name: productMap[item.product_id]?.name || 'Produto Desconhecido',
        image: productMap[item.product_id]?.image_url,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes || undefined
      }));
      setSelectedOrder({ ...order, items: fetchedItems });
      setDetailsOpen(true);
    } catch (e) {
      console.error('Erro ao carregar detalhes do pedido:', e);
      toast({ title: 'Erro ao carregar detalhes', description: e instanceof Error ? e.message : String(e), variant: 'destructive' });
    }
  };
  
  const handleCancelOrder = (orderId: number) => {
    setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
  };

  // Pedidos na fila (inclui pedidos 'queued' = 'pending' do delivery e 'preparing' do fluxo interno)
  // Exibir todos os pedidos sem filtrar por status, para garantir que todos apareçam
  const allOrders = orders;
  // Restaurando variáveis queuedOrders, inProgressOrders, readyOrders e pickedUpOrders filtrando o array orders conforme o status, sem alterar layout ou UX.
  const queuedOrders = orders.filter(order => {
    const statusMatch = order.status === 'preparing' || order.status === 'queued' || order.status === 'pending';
    if (!statusMatch) return false;
    if (queueFilter === 'all') return true;
    if (queueFilter === 'store' && !order.isDelivery) return true;
    if (queueFilter === 'delivery' && order.isDelivery) return true;
    return false;
  });
  const inProgressOrders = orders.filter(order => {
    const statusMatch = order.status === 'in_progress';
    if (!statusMatch) return false;
    if (inProgressFilter === 'all') return true;
    if (inProgressFilter === 'store' && !order.isDelivery) return true;
    if (inProgressFilter === 'delivery' && order.isDelivery) return true;
    return false;
  });
  const readyOrders = orders.filter(order => {
    const statusMatch = order.status === 'ready';
    if (!statusMatch) return false;
    if (readyFilter === 'all') return true;
    if (readyFilter === 'store' && !order.isDelivery) return true;
    if (readyFilter === 'delivery' && order.isDelivery) return true;
    return false;
  });
  const pickedUpOrders = orders.filter(order => {
    const statusMatch = order.status === 'picked_up';
    if (!statusMatch) return false;
    if (pickedUpFilter === 'all') return true;
    if (pickedUpFilter === 'store' && !order.isDelivery) return true;
    if (pickedUpFilter === 'delivery' && order.isDelivery) return true;
    return false;
  });

  const fetchOrders = async () => {
    try {
      // Buscar apenas pedidos que estão em preparo ou prontos (enviados para a cozinha)
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['preparing', 'in_progress', 'ready', 'picked_up']);
      if (ordersError) throw ordersError;
      
      // Se não houver pedidos, inicializar com array vazio
      if (!ordersData || ordersData.length === 0) {
        setOrders([]);
        return;
      }
      
      const orderIds = ordersData.map(o => o.id);
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
      
      setOrders(ordersData.map(order => {
        // Processar os itens do pedido com informações dos produtos
        const orderItems = itemsData
          .filter(item => item.order_id === order.id)
          .map(item => ({
            name: productMap[item.product_id]?.name || 'Produto Desconhecido',
            quantity: item.quantity,
            price: item.price,
            notes: item.notes || undefined,
            image: productMap[item.product_id]?.image_url
          }));
          
        return {
          ...order,
          items: orderItems
        };
      }));
    } catch (e) {
      console.error('Erro ao buscar pedidos:', e);
      toast({ title: 'Erro ao buscar pedidos', description: e instanceof Error ? e.message : String(e), variant: 'destructive' });
    }
  };
  
  useEffect(() => {
    // Carregar estado dos filtros do localStorage quando o componente montar
    const loadFilterStates = () => {
      try {
        const savedFilters = localStorage.getItem(`kitchen_filters_${currentUser?.id}`);
        if (savedFilters) {
          const settings = JSON.parse(savedFilters);
          setQueueFilter(settings.queueFilter || 'all');
          setInProgressFilter(settings.inProgressFilter || 'all');
          setReadyFilter(settings.readyFilter || 'all');
          setPickedUpFilter(settings.pickedUpFilter || 'all');
        }
      } catch (e) {
        console.error('Erro ao processar filtros:', e);
      }
    };
    
    if (currentUser?.id) {
      loadFilterStates();
    }
    
    fetchOrders();
  }, [currentUser?.id]);
  
  // Função para salvar um estado de filtro no localStorage
  const saveFilterState = (tabName: string, filterValue: 'all' | 'store' | 'delivery') => {
    if (!currentUser?.id) return;
    
    try {
      // Buscar configurações atuais do localStorage
      const savedFilters = localStorage.getItem(`kitchen_filters_${currentUser.id}`);
      const currentSettings = savedFilters ? JSON.parse(savedFilters) : {};
      
      const updatedSettings = { 
        ...currentSettings,
        [tabName + 'Filter']: filterValue
      };
      
      // Salvar configurações atualizadas
      localStorage.setItem(`kitchen_filters_${currentUser.id}`, JSON.stringify(updatedSettings));
    } catch (e) {
      console.error('Erro ao processar salvamento de filtro:', e);
    }
  };
  
  // Handlers para cada filtro de tab
  const handleQueueFilterChange = (value: 'all' | 'store' | 'delivery') => {
    setQueueFilter(value);
    saveFilterState('queue', value);
  };
  
  const handleInProgressFilterChange = (value: 'all' | 'store' | 'delivery') => {
    setInProgressFilter(value);
    saveFilterState('inProgress', value);
  };
  
  const handleReadyFilterChange = (value: 'all' | 'store' | 'delivery') => {
    setReadyFilter(value);
    saveFilterState('ready', value);
  };
  
  const handlePickedUpFilterChange = (value: 'all' | 'store' | 'delivery') => {
    setPickedUpFilter(value);
    saveFilterState('pickedUp', value);
  };

  const renderOrderCard = (order: typeof orders[0]) => (
    <Card key={order.id} className="overflow-hidden mb-4">
      <div className={`h-2 ${
        order.status === 'preparing' || order.status === 'queued' ? 'bg-yellow-500' : 
        order.status === 'in_progress' ? 'bg-blue-500' : 
        order.status === 'ready' ? 'bg-green-500' : 'bg-gray-500'
      }`}></div>
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="flex items-center gap-2">
            #{order.id} {!order.isDelivery && order.table && <span className="font-medium">Mesa {order.table}</span>}
            {order.isDelivery && (
              <Badge className="bg-indigo-100 text-indigo-800">Delivery</Badge>
            )}
          </CardTitle>
          <Badge className={`${
            order.status === 'preparing' || order.status === 'queued' ? 'bg-yellow-100 text-yellow-800' : 
            order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
            order.status === 'ready' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {order.status === 'preparing' || order.status === 'queued' ? 'Na fila' : 
             order.status === 'in_progress' ? 'Em preparo' : 
             order.status === 'ready' ? 'Pronto' : 'Retirado'}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {new Date(order.createdAt).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Itens</h4>
            <ul className="space-y-2">
              {order.items.map((item, index) => (
                <li key={index} className="flex flex-col">
                  <div className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.name}</span>
                    <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                  {item.notes && (
                    <span className="text-xs text-red-500 italic">{item.notes}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
          
          <Separator />
          
          <div className="pt-2 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total: R$ {order.total.toFixed(2)}</span>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={() => handleOpenDetails(order)}
              >
                <ClipboardList className="h-4 w-4" />
                Detalhes
              </Button>
            </div>
            
            {(order.status === 'preparing' || order.status === 'queued') && (
              <Button 
                className="w-full"
                onClick={() => handleStartPreparation(order.id)}
              >
                Iniciar Preparo
              </Button>
            )}
            
            {order.status === 'in_progress' && (
              <Button 
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => handleFinishPreparation(order.id)}
              >
                Marcar como Pronto
              </Button>
            )}
            
            {order.status === 'ready' && (
              <Button 
                className="w-full"
                variant="outline"
                onClick={() => handlePickedUp(order.id)}
              >
                Confirmar Retirada
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Gerenciamento de Cozinha</h1>
          <Button variant="outline" onClick={() => navigate('/order-management')}>
            Ver Mesas
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="preparing" className="flex items-center gap-2">
              Na Fila
              {queuedOrders.length > 0 && (
                <Badge variant="outline" className="ml-1">{queuedOrders.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="in_progress" className="flex items-center gap-2">
              Em Preparo
              {inProgressOrders.length > 0 && (
                <Badge variant="outline" className="ml-1">{inProgressOrders.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="ready" className="flex items-center gap-2">
              Prontos
              {readyOrders.length > 0 && (
                <Badge variant="outline" className="ml-1">{readyOrders.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="picked_up" className="flex items-center gap-2">
              Retirados
              {pickedUpOrders.length > 0 && (
                <Badge variant="outline" className="ml-1">{pickedUpOrders.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="preparing" className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Pedidos na Fila</h2>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex gap-2 items-center">
                    <Filter className="h-4 w-4" />
                    {queueFilter === 'all' ? 'Todos os Pedidos' : 
                     queueFilter === 'store' ? 'Pedidos da Loja' : 'Pedidos Delivery'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filtrar Pedidos</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup value={queueFilter} onValueChange={(v) => handleQueueFilterChange(v as 'all' | 'store' | 'delivery')}>
                    <DropdownMenuRadioItem value="all">Todos os Pedidos</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="store">Pedidos da Loja</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="delivery">Pedidos Delivery</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {queuedOrders.length === 0 ? (
              <div className="text-center py-8">
                <UtensilsCrossed className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-500">Não há pedidos na fila no momento</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {queuedOrders.map(renderOrderCard)}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="in_progress" className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Pedidos em Preparo</h2>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex gap-2 items-center">
                    <Filter className="h-4 w-4" />
                    {inProgressFilter === 'all' ? 'Todos os Pedidos' : 
                     inProgressFilter === 'store' ? 'Pedidos da Loja' : 'Pedidos Delivery'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filtrar Pedidos</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup value={inProgressFilter} onValueChange={(v) => handleInProgressFilterChange(v as 'all' | 'store' | 'delivery')}>
                    <DropdownMenuRadioItem value="all">Todos os Pedidos</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="store">Pedidos da Loja</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="delivery">Pedidos Delivery</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {inProgressOrders.length === 0 ? (
              <div className="text-center py-8">
                <UtensilsCrossed className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-500">Não há pedidos em preparo no momento</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inProgressOrders.map(renderOrderCard)}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="ready" className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Pedidos Prontos</h2>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex gap-2 items-center">
                    <Filter className="h-4 w-4" />
                    {readyFilter === 'all' ? 'Todos os Pedidos' : 
                     readyFilter === 'store' ? 'Pedidos da Loja' : 'Pedidos Delivery'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filtrar Pedidos</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup value={readyFilter} onValueChange={(v) => handleReadyFilterChange(v as 'all' | 'store' | 'delivery')}>
                    <DropdownMenuRadioItem value="all">Todos os Pedidos</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="store">Pedidos da Loja</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="delivery">Pedidos Delivery</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {readyOrders.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-500">Não há pedidos prontos para retirada</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {readyOrders.map(renderOrderCard)}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="picked_up" className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Pedidos Retirados</h2>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex gap-2 items-center">
                    <Filter className="h-4 w-4" />
                    {pickedUpFilter === 'all' ? 'Todos os Pedidos' : 
                     pickedUpFilter === 'store' ? 'Pedidos da Loja' : 'Pedidos Delivery'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filtrar Pedidos</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup value={pickedUpFilter} onValueChange={(v) => handlePickedUpFilterChange(v as 'all' | 'store' | 'delivery')}>
                    <DropdownMenuRadioItem value="all">Todos os Pedidos</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="store">Pedidos da Loja</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="delivery">Pedidos Delivery</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {pickedUpOrders.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-500">Não há pedidos retirados recentemente</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pickedUpOrders.map(renderOrderCard)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Detalhes do Pedido */}
      {selectedOrder && (
        <KitchenOrderDetails
          order={selectedOrder}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          onStartPreparation={handleStartPreparation}
          onFinishPreparation={handleFinishPreparation}
          onCancelOrder={handleCancelOrder}
        />
      )}
    </div>
  );
};

export default KitchenManagement;
