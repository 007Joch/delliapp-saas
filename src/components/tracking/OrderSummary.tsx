
import React from 'react';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

interface OrderSummaryProps {
  items: OrderItem[];
  total: number;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ items, total }) => {
  return (
    <div>
      <h3 className="font-bold mb-3">Resumo do Pedido</h3>
      <ul className="space-y-2">
        {items.map((item, index) => (
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
      
      <div className="border-t mt-4 pt-4">
        <div className="flex justify-between font-medium">
          <span>Total</span>
          <span>R$ {total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
