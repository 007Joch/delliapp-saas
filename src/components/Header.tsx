
import React from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Menu } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';
import { Link } from 'react-router-dom';
import { useUserSwitcher } from '@/context/UserSwitcherContext';

const Header = () => {
  const { totalItems, toggleCart } = useCart();
  const { currentUser } = useUserSwitcher();
  
  const isAdminOrOwner = currentUser?.role === 'admin' || currentUser?.role === 'restaurant_owner';

  return (
    <header className="fixed top-0 z-50 w-full bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col h-full">
                <h3 className="text-lg font-bold mb-4">Menu</h3>
                <nav className="flex flex-col gap-4">
                  <Link to="/" className="text-lg font-medium hover:text-menu-primary py-2 border-b border-gray-100">
                    Home
                  </Link>
                  <Link to="/login" className="text-lg font-medium hover:text-menu-primary py-2 border-b border-gray-100">
                    Login / Cadastro
                  </Link>
                  <Link to="/order-tracking" className="text-lg font-medium hover:text-menu-primary py-2 border-b border-gray-100">
                    Acompanhar Pedido
                  </Link>
                  
                  {/* Páginas visíveis apenas para Garçons, Chef, Admin e Dono */}
                  {['waiter', 'chef', 'admin', 'restaurant_owner'].includes(currentUser?.role || '') && (
                    <Link to="/order-management" className="text-lg font-medium hover:text-menu-primary py-2 border-b border-gray-100">
                      Gerenciamento de Pedidos
                    </Link>
                  )}
                  
                  {/* Páginas visíveis apenas para Chef, Admin e Dono */}
                  {['chef', 'admin', 'restaurant_owner'].includes(currentUser?.role || '') && (
                    <Link to="/kitchen-management" className="text-lg font-medium hover:text-menu-primary py-2 border-b border-gray-100">
                      Gerenciamento de Cozinha
                    </Link>
                  )}
                  
                  {/* Páginas visíveis apenas para Admin e Dono */}
                  {isAdminOrOwner && (
                    <>
                      <Link to="/product-management" className="text-lg font-medium hover:text-menu-primary py-2 border-b border-gray-100">
                        Gerenciamento de Produtos
                      </Link>
                      <Link to="/user-management" className="text-lg font-medium hover:text-menu-primary py-2 border-b border-gray-100">
                        Gerenciamento de Usuários
                      </Link>
                      <Link to="/api-management" className="text-lg font-medium hover:text-menu-primary py-2 border-b border-gray-100">
                        Gerenciamento de APIs
                      </Link>
                    </>
                  )}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
          <a href="/" className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-menu-primary">Cardápio<span className="text-menu-accent">Digital</span></h1>
          </a>
        </div>
        
        <Button 
          onClick={toggleCart}
          variant="ghost" 
          className="relative p-2"
          aria-label="Shopping cart"
        >
          <ShoppingCart className="h-6 w-6" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-menu-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </Button>
      </div>
    </header>
  );
};

export default Header;
