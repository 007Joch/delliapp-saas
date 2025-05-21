
import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ShoppingBag, MapPin, Home, Store, ArrowLeft } from 'lucide-react';
import TableOrderForm from './checkout/TableOrderForm';
import DeliveryAddressForm from './checkout/DeliveryAddressForm';
import PickupForm from './checkout/PickupForm';

type DeliveryOption = 'table' | 'delivery' | 'pickup';

const Checkout = ({ onBack }: { onBack: () => void }) => {
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption | null>(null);
  const { subtotal, closeCart } = useCart();

  const handleBack = () => {
    // Se estiver em uma etapa de entrega, volta para a seleção de opções
    if (deliveryOption) {
      setDeliveryOption(null);
    } else {
      // Se estiver na seleção de opções, volta para o carrinho
      onBack();
    }
  };

  const renderDeliveryForm = () => {
    switch (deliveryOption) {
      case 'table':
        return <TableOrderForm onSuccess={() => closeCart()} />;
      case 'delivery':
        return <DeliveryAddressForm onSuccess={() => closeCart()} />;
      case 'pickup':
        return <PickupForm onSuccess={() => closeCart()} />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 flex items-center justify-between border-b">
        <h2 className="text-xl font-bold flex items-center">
          <ShoppingBag className="mr-2" /> Checkout
        </h2>
        <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-full" aria-label="Voltar">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-grow overflow-auto p-4">
        {!deliveryOption ? (
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Forma de entrega</h3>
            
            <RadioGroup 
              value={deliveryOption || ''} 
              onValueChange={(value) => setDeliveryOption(value as DeliveryOption)}
              className="space-y-3"
            >
              <div>
                <Card className={`p-4 cursor-pointer ${deliveryOption === 'table' ? 'border-menu-primary ring-2 ring-menu-primary' : ''}`}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="table" id="table" />
                    <Label htmlFor="table" className="flex items-center cursor-pointer">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>Estou na loja</span>
                    </Label>
                  </div>
                </Card>
              </div>
              
              <div>
                <Card className={`p-4 cursor-pointer ${deliveryOption === 'delivery' ? 'border-menu-primary ring-2 ring-menu-primary' : ''}`}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="delivery" id="delivery" />
                    <Label htmlFor="delivery" className="flex items-center cursor-pointer">
                      <Home className="h-4 w-4 mr-2" />
                      <span>Receber em casa</span>
                    </Label>
                  </div>
                </Card>
              </div>
              
              <div>
                <Card className={`p-4 cursor-pointer ${deliveryOption === 'pickup' ? 'border-menu-primary ring-2 ring-menu-primary' : ''}`}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pickup" id="pickup" />
                    <Label htmlFor="pickup" className="flex items-center cursor-pointer">
                      <Store className="h-4 w-4 mr-2" />
                      <span>Retirar na loja</span>
                    </Label>
                  </div>
                </Card>
              </div>
            </RadioGroup>
          </div>
        ) : (
          renderDeliveryForm()
        )}
      </div>
    </div>
  );
};

export default Checkout;
