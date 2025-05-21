
import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Minus, Plus, X, ShoppingBag } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import Checkout from './Checkout';

const Cart = () => {
  const [isCheckoutActive, setIsCheckoutActive] = useState(false);
  const { 
    cartItems, 
    cartOpen, 
    toggleCart, 
    removeFromCart, 
    updateQuantity,
    clearCart,
    subtotal,
    closeCart
  } = useCart();

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione itens ao carrinho para finalizar o pedido.",
      });
      return;
    }
    setIsCheckoutActive(true);
  };

  const handleBackFromCheckout = () => {
    setIsCheckoutActive(false);
  };

  return (
    <div className={`fixed inset-0 z-50 bg-black/50 ${cartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-300`}>
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-xl ${
          cartOpen ? 'translate-x-0 animate-cart-slide-in' : 'translate-x-full animate-cart-slide-out'
        } transition-transform duration-300 flex flex-col`}
      >
        {isCheckoutActive ? (
          <Checkout onBack={handleBackFromCheckout} />
        ) : (
          <>
            <div className="p-4 flex items-center justify-between border-b">
              <h2 className="text-xl font-bold flex items-center">
                <ShoppingBag className="mr-2" /> Carrinho
              </h2>
              <Button variant="ghost" size="icon" onClick={toggleCart}>
                <X className="h-6 w-6" />
              </Button>
            </div>

            <div className="flex-grow overflow-auto p-4">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <ShoppingBag className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-500">Seu carrinho está vazio</h3>
                  <p className="text-gray-400 mt-2 mb-6">Adicione itens do cardápio para começar</p>
                  <Button onClick={toggleCart}>Continuar comprando</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map(item => (
                    <Card key={item.id} className="p-4">
                      <div className="flex gap-3">
                        <img 
                          src={item.imageUrl || item.image} 
                          alt={item.name} 
                          className="h-20 w-20 object-cover rounded-md"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h3 className="font-medium">{item.name}</h3>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-gray-400"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            R$ {item.price.toFixed(2)}
                          </div>
                          
                          {item.notes && (
                            <div className="text-sm text-red-500 italic mt-1">
                              {item.notes}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center border rounded">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 p-0"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 p-0"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="font-medium">
                              R$ {(item.price * item.quantity).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-4 border-t">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-4">
                  <span className="text-gray-600">Taxa de entrega</span>
                  <span className="font-medium">R$ 5.00</span>
                </div>
                <Separator className="my-3" />
                <div className="flex justify-between mb-4">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-bold text-lg">R$ {(subtotal + 5).toFixed(2)}</span>
                </div>
                <div className="space-y-2">
                  <Button className="w-full bg-menu-primary hover:bg-menu-primary/90" onClick={handleCheckout}>
                    Finalizar pedido
                  </Button>
                  <Button variant="outline" className="w-full" onClick={clearCart}>
                    Limpar carrinho
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Cart;
