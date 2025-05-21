
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useCart } from '@/context/CartContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";

const TableOrderForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [tableName, setTableName] = useState('');
  const { cartItems, subtotal, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleTableOrder = async () => {
    if (!tableName) {
      toast({
        title: "Mesa obrigatória",
        description: "Por favor, informe o número da mesa.",
        variant: "destructive"
      });
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione itens ao carrinho antes de finalizar o pedido.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Tentar salvar no Supabase
      const orderItems = cartItems.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes
      }));

      // Primeiro, criar o pedido
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            total: subtotal,
            delivery_type: 'local',
            table_name: tableName,
            status: 'pending',
            restaurant_id: 1
          }
        ])
        .select();

      if (orderError) {
        console.error("Erro ao criar pedido:", orderError);
        throw new Error("Não foi possível criar o pedido");
      }

      if (!orderData || orderData.length === 0) {
        throw new Error("Nenhum dado retornado ao criar pedido");
      }

      const orderId = orderData[0].id;

      // Em seguida, criar os itens do pedido
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(
          orderItems.map(item => ({
            ...item,
            order_id: orderId
          }))
        );

      if (itemsError) {
        console.error("Erro ao criar itens do pedido:", itemsError);
        throw new Error("Não foi possível adicionar os itens ao pedido");
      }

      // Salvar o pedido no localStorage também (para compatibilidade offline e sistema de mesas dinâmico)
      const tableOrders = JSON.parse(localStorage.getItem('tableOrders') || '[]');
      const newOrder = {
        id: orderId,
        table: tableName,
        status: 'pending',
        items: cartItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes
        })),
        total: subtotal,
        createdAt: new Date().toISOString(),
        assignedTo: null
      };
      tableOrders.push(newOrder);
      localStorage.setItem('tableOrders', JSON.stringify(tableOrders));

      // Limpar o carrinho
      clearCart();
      
      // Chamar o callback de sucesso (que irá fechar o carrinho)
      if (onSuccess) {
        onSuccess();
      }
      
      // Mostrar mensagem de sucesso
      toast({
        title: "Pedido realizado com sucesso!",
        description: `Seu pedido para a mesa ${tableName} foi registrado.`,
      });
      
      // Aguardar 3 segundos e redirecionar para o menu principal
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (error) {
      console.error("Erro ao processar pedido:", error);
      
      toast({
        title: "Erro ao finalizar pedido",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao processar seu pedido",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label htmlFor="table-number">Número da Mesa</Label>
        <Input
          id="table-number"
          placeholder="Ex: Mesa 5"
          value={tableName}
          onChange={(e) => setTableName(e.target.value)}
        />
      </div>

      <div className="pt-4 border-t">
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-6">
          <span className="font-bold text-lg">Total</span>
          <span className="font-bold text-lg">R$ {subtotal.toFixed(2)}</span>
        </div>
      </div>

      <Button
        onClick={handleTableOrder}
        className="w-full bg-menu-primary hover:bg-menu-primary/90"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Processando..." : "Finalizar Pedido"}
      </Button>
    </div>
  );
};

export default TableOrderForm;
