import React, { useState, useEffect, useCallback } from 'react';
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
import { Edit, X, Trash2, Plus, Minus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  notes?: string;
  image?: string;
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

interface OrderDetailsDialogProps {
  order: OrderProps;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserRole: string;
}

const OrderDetailsDialog: React.FC<OrderDetailsDialogProps> = ({ 
  order, 
  open, 
  onOpenChange,
  currentUserRole
}) => {
  const [currentStatus, setCurrentStatus] = useState<'pending' | 'preparing' | 'ready' | 'delivered'>(order.status as any || 'pending');
  const [localOrder, setLocalOrder] = useState<OrderProps>(order);
  const [activeTab, setActiveTab] = useState('pending');
  const [editingTable, setEditingTable] = useState(false);
  const [newTableName, setNewTableName] = useState(order.table);
  const [preparingItems, setPreparingItems] = useState<OrderItem[]>([]);
  const [deliveredItems, setDeliveredItems] = useState<OrderItem[]>([]);
  
  const canEdit = ['admin', 'restaurant_owner', 'waiter'].includes(currentUserRole);
  
  // Item placeholders - em produção isso viria de um banco de imagens
  const itemPlaceholders = [
    "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9",
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38"
  ];
  
  // Função para buscar status e itens no Supabase
  const fetchOrderDetails = useCallback(async () => {
    try {
      // Status do pedido
      const { data: orderRow, error: orderError } = await supabase
        .from('orders')
        .select('status')
        .eq('id', order.id)
        .single();
      if (orderRow) {
        setCurrentStatus(orderRow.status as any);
        setActiveTab(orderRow.status as any);
      }
      // Itens do pedido
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('order_id, quantity, price, notes, product_id')
        .eq('order_id', order.id);
      if (itemsError || !itemsData) throw itemsError;
      // Buscar nomes e imagens de produtos
      const productIds = Array.from(new Set(itemsData.map(i => i.product_id)));
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, image_url')
        .in('id', productIds);
      const productMap: Record<number, {name: string; image_url?: string}> = {};
      productsData?.forEach(p => { productMap[p.id] = p; });
      const fetchedItems = itemsData.map(item => ({
        name: productMap[item.product_id]?.name || 'Produto Desconhecido',
        image: productMap[item.product_id]?.image_url || undefined,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes || undefined
      }));
      setLocalOrder(prev => ({ ...prev, items: fetchedItems, total: fetchedItems.reduce((s,i)=>s+i.price*i.quantity,0) }));
      // Sessões
      setPreparingItems(orderRow?.status === 'preparing' ? fetchedItems : []);
      setDeliveredItems(['ready','delivered'].includes(orderRow?.status || '') ? fetchedItems : []);
    } catch (e) {
      console.error('Erro ao buscar detalhes do pedido:', e);
    }
  }, [order.id]);

  useEffect(() => {
    fetchOrderDetails();
  }, [order.id]);

  const handleSendToKitchen = async () => {
    // Atualiza o status para preparing
    setCurrentStatus('preparing');
    setActiveTab('preparing');
    
    // Mover todos os itens pendentes para a lista de em preparo
    setPreparingItems([...localOrder.items]);
    
    // Atualizar status no Supabase
    try {
      const { error: statusError } = await supabase
        .from('orders')
        .update({ 
          status: 'preparing'
          // Não usamos sent_to_kitchen ou kitchen_sent_at pois podem não existir na tabela
        })
        .eq('id', order.id);
      
      if (statusError) {
        console.error('Erro ao atualizar status no Supabase:', statusError);
        toast({
          title: "Erro ao enviar para cozinha",
          description: statusError.message,
          variant: "destructive"
        });
        return;
      }
    } catch (e) {
      console.error('Erro ao chamar Supabase:', e);
      toast({
        title: "Erro ao enviar para cozinha",
        description: e instanceof Error ? e.message : "Erro desconhecido",
        variant: "destructive"
      });
      return;
    }
    
    // Atualizar localStorage
    const tableOrders = JSON.parse(localStorage.getItem('tableOrders') || '[]');
    const updatedOrders = tableOrders.map((o: any) =>
      o.id === order.id ? { 
        ...o, 
        status: 'preparing'
        // Não usamos sent_to_kitchen ou kitchen_sent_at pois podem não existir
      } : o
    );
    localStorage.setItem('tableOrders', JSON.stringify(updatedOrders));
    
    // Recarregar dados do Supabase
    await fetchOrderDetails();
    
    toast({
      title: "Pedido enviado para a cozinha",
      description: `O pedido de ${localOrder.table} foi enviado para preparo`,
    });
    
    // Atualizar o localStorage específico da cozinha para garantir consistência
    const kitchenOrders = JSON.parse(localStorage.getItem('kitchenOrders') || '[]');
    const updatedKitchenOrders = [...kitchenOrders, {
      ...localOrder,
      status: 'preparing'
      // Não usamos sent_to_kitchen ou kitchen_sent_at pois podem não existir
    }];
    localStorage.setItem('kitchenOrders', JSON.stringify(updatedKitchenOrders));
  };
  
  const handleReleaseTable = () => {
    toast({
      title: "Mesa liberada",
      description: `${localOrder.table} foi liberada com sucesso`,
    });
    onOpenChange(false);
  };
  
  const handleEditTableName = () => {
    if (editingTable) {
      setLocalOrder(prev => ({...prev, table: newTableName}));
      toast({
        title: "Nome atualizado",
      description: `Renomeado para ${newTableName}`,
      });
      setEditingTable(false);
    } else {
      setEditingTable(true);
    }
  };
  
  const handleUpdateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return; // Não permitir quantidade menor que 1
    
    const updatedItems = [...localOrder.items];
    const oldQuantity = updatedItems[index].quantity;
    updatedItems[index].quantity = newQuantity;
    
    // Recalcular o total
    const priceDifference = updatedItems[index].price * (newQuantity - oldQuantity);
    const newTotal = localOrder.total + priceDifference;
    
    setLocalOrder({
      ...localOrder,
      items: updatedItems,
      total: newTotal
    });
    
    toast({
      title: "Quantidade atualizada",
      description: `${updatedItems[index].name}: ${oldQuantity} → ${newQuantity}`,
    });
  };
  
  const handleRemoveItem = (index: number) => {
    if (currentStatus === 'pending') {
      const newItems = [...localOrder.items];
      const removedItem = newItems[index];
      newItems.splice(index, 1);
      
      const newTotal = localOrder.total - (removedItem.price * removedItem.quantity);
      
      setLocalOrder({
        ...localOrder,
        items: newItems,
        total: newTotal
      });
      
      toast({
        title: "Item removido",
        description: `${removedItem.name} foi removido do pedido`,
      });
    } else {
      toast({
        title: "Não é possível remover",
        description: "Pedidos em preparo ou entregues não podem ser editados",
        variant: "destructive"
      });
    }
  };

  const getPendingItems = () => localOrder.items.filter((_, i) => 
    currentStatus === 'pending' || preparingItems.length === 0
  );
  
  const getPreparingItems = () => 
    currentStatus !== 'pending' ? preparingItems : [];
  
  const getDeliveredItems = () => 
    currentStatus === 'delivered' || currentStatus === 'ready' ? deliveredItems : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
        <div className="flex justify-between items-center">
          <DialogTitle className="text-2xl flex items-center gap-2">
            {!editingTable ? (
              <>
                {localOrder.table_name || localOrder.table}
                {canEdit && (
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleEditTableName}>
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Input 
                  value={newTableName} 
                  onChange={(e) => setNewTableName(e.target.value)}
                  className="h-9 w-40"
                  autoFocus
                />
                <Button variant="outline" size="sm" onClick={handleEditTableName}>
                  Salvar
                </Button>
              </div>
            )}
          </DialogTitle>
        </div>
      </DialogHeader>
        
        <div className="flex items-center gap-2 mb-4">
          <Badge className={`px-3 py-1 ${currentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : currentStatus === 'preparing' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
            {currentStatus === 'pending' ? 'Pendente' : 
             currentStatus === 'preparing' ? 'Em produção' : 'Entregue'}
          </Badge>
          <span className="text-gray-600 text-sm">Sendo atendido por {localOrder.assignedTo || "ninguém"}</span>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="pending">Pendente</TabsTrigger>
            <TabsTrigger value="preparing">Em produção</TabsTrigger>
            <TabsTrigger value="delivered">Entregue</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="mt-4">
            <h3 className="font-bold text-lg mb-2">Itens Pendentes</h3>
            <div className="space-y-4 mb-4 max-h-64 overflow-y-auto">
              {getPendingItems().length > 0 ? getPendingItems().map((item, index) => (
                <div key={`pending-${index}`} className="flex items-start gap-3">
                  <div className="w-16 h-16 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                    <img 
                      src={item.image || itemPlaceholders[index % itemPlaceholders.length]} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h4 className="font-semibold">{item.name}</h4>
                      <span className="font-medium">R$ {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                    {item.notes && (
                      <p className="text-sm text-red-500 italic mt-1">{item.notes}</p>
                    )}
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-sm text-gray-600">Qtd:</span>
                      {canEdit && currentStatus === 'pending' ? (
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => handleUpdateQuantity(index, Math.max(1, item.quantity - 1))}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="font-medium w-6 text-center">{item.quantity}</span>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => handleUpdateQuantity(index, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <span>{item.quantity}</span>
                      )}
                    </div>
                  </div>
                  
                  {canEdit && currentStatus === 'pending' && (
                    <div className="flex-shrink-0">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:text-red-700"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )) : (
                <p className="text-gray-500 text-center py-4">
                  Não há itens pendentes.
                </p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="preparing" className="mt-4">
            <h3 className="font-bold text-lg mb-2">Itens em Preparo</h3>
            <div className="space-y-4 mb-4 max-h-64 overflow-y-auto">
              {currentStatus === 'pending' ? (
                <p className="text-gray-500 text-center py-4">
                  Não há itens em preparo. Envie o pedido para a cozinha primeiro.
                </p>
              ) : getPreparingItems().length > 0 ? (
                getPreparingItems().map((item, index) => (
                  <div key={`preparing-${index}`} className="flex items-start gap-3">
                    <div className="w-16 h-16 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                      <img 
                        src={item.image || itemPlaceholders[(index + 1) % itemPlaceholders.length]} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h4 className="font-semibold">{item.name}</h4>
                        <span className="font-medium">R$ {(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                      {item.notes && (
                        <p className="text-sm text-red-500 italic mt-1">{item.notes}</p>
                      )}
                      <div className="mt-1">
                        <span className="text-sm text-gray-600">Qtd: {item.quantity}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Todos os itens estão prontos para entrega.
                </p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="delivered" className="mt-4">
            <h3 className="font-bold text-lg mb-2">Itens Entregues</h3>
            <div className="space-y-4 mb-4 max-h-64 overflow-y-auto">
              {getDeliveredItems().length > 0 ? (
                getDeliveredItems().map((item, index) => (
                  <div key={`delivered-${index}`} className="flex items-start gap-3">
                    <div className="w-16 h-16 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                      <img 
                        src={item.image || itemPlaceholders[(index + 2) % itemPlaceholders.length]} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h4 className="font-semibold">{item.name}</h4>
                        <span className="font-medium">R$ {(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                      {item.notes && (
                        <p className="text-sm text-red-500 italic mt-1">{item.notes}</p>
                      )}
                      <div className="mt-1">
                        <span className="text-sm text-gray-600">Qtd: {item.quantity}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Nenhum item foi entregue ainda.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <Separator className="my-4" />
        
        <div className="flex justify-between items-center text-lg font-bold mb-6">
          <span>Total</span>
          <span>R$ {localOrder.total.toFixed(2)}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={handleSendToKitchen}
            disabled={currentStatus !== 'pending' || localOrder.items.length === 0}
          >
            Mandar p/ Cozinha
          </Button>
          
          <Button 
            variant="destructive"
            className="w-full"
            onClick={handleReleaseTable}
          >
            Liberar Mesa
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsDialog;
