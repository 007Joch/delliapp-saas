
import React from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useCart } from '@/context/CartContext';

// Add the onSuccess prop to the component
interface PickupFormProps {
  onSuccess?: () => void;
}

const PickupForm = ({ onSuccess }: PickupFormProps) => {
  const { subtotal, clearCart } = useCart();

  const handlePickupOrder = () => {
    toast({
      title: "Em desenvolvimento",
      description: "A funcionalidade de retirada na loja estará disponível em breve.",
    });

    // Aqui implementaremos o fluxo de retirada na loja no futuro
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-gray-50 rounded-md">
        <p className="text-gray-600">
          Esta funcionalidade está em desenvolvimento. Em breve você poderá realizar pedidos para retirada na loja.
        </p>
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
        onClick={handlePickupOrder}
        className="w-full bg-menu-primary hover:bg-menu-primary/90"
        disabled
      >
        Em breve disponível
      </Button>
    </div>
  );
};

export default PickupForm;
