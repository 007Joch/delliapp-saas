
import React, { useEffect, useRef, useState } from 'react';
import { useUserSwitcher } from '@/context/UserSwitcherContext';
import { Button } from '@/components/ui/button';
import { 
  User, ChevronUp, ChevronDown, Shield, Utensils, 
  UtensilsCrossed, Truck, UserCircle2, UserRound, X 
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const UserSwitcher = () => {
  const { 
    currentUser, 
    switchUser, 
    isUserSwitcherOpen, 
    toggleUserSwitcher, 
    closeUserSwitcher 
  } = useUserSwitcher();
  
  const isMobile = useIsMobile();
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: -1, y: -1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [didMove, setDidMove] = useState(false);

  // Inicializar posição na primeira montagem
  useEffect(() => {
    // Tentar recuperar posição salva
    const savedPosition = localStorage.getItem('userSwitcherPosition');
    if (savedPosition) {
      setPosition(JSON.parse(savedPosition));
    } else {
      // Posição padrão: canto inferior direito
      setPosition({
        x: window.innerWidth - 100,
        y: window.innerHeight - 100
      });
    }
  }, []);

  // Salvar posição no localStorage quando mudar
  useEffect(() => {
    if (position.x !== -1 && position.y !== -1) {
      localStorage.setItem('userSwitcherPosition', JSON.stringify(position));
    }
  }, [position]);

  // Fechar menu quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeUserSwitcher();
      }
    };

    if (isUserSwitcherOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserSwitcherOpen, closeUserSwitcher]);

  // Handlers para arrastar o botão
  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevenir que o clique normal seja acionado quando começar a arrastar
    e.stopPropagation();
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
    setDidMove(false);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      // Marcar que houve movimento
      setDidMove(true);
      
      // Calcular nova posição com base no offset do mouse
      const newX = Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - 100));
      const newY = Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - 100));
      
      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    // Apenas aciona o toggle se não estiver arrastando ou não tiver movido
    if (!didMove) {
      toggleUserSwitcher();
    }
    setDidMove(false);
  };

  // Adicionar/remover event listeners globais para drag
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const roleIcons = {
    admin: <Shield className="h-5 w-5" />,
    restaurant_owner: <User className="h-5 w-5" />,
    waiter: <Utensils className="h-5 w-5" />,
    chef: <UtensilsCrossed className="h-5 w-5" />,
    delivery_person: <Truck className="h-5 w-5" />,
    customer: <UserCircle2 className="h-5 w-5" />,
    visitor: <UserRound className="h-5 w-5" />
  };

  const roleColors = {
    admin: "bg-red-500 hover:bg-red-600",
    restaurant_owner: "bg-purple-500 hover:bg-purple-600",
    waiter: "bg-blue-500 hover:bg-blue-600",
    chef: "bg-yellow-500 hover:bg-yellow-600 text-black",
    delivery_person: "bg-green-500 hover:bg-green-600",
    customer: "bg-menu-primary hover:bg-menu-primary/90",
    visitor: "bg-gray-500 hover:bg-gray-600"
  };

  const roleLabels = {
    admin: "Admin",
    restaurant_owner: "Dono",
    waiter: "Garçom",
    chef: "Cozinha",
    delivery_person: "Entregador",
    customer: "Cliente",
    visitor: "Visitante"
  };

  // Fix for mobile - ensure component is absolutely positioned within viewport
  const style = position.x !== -1 ? {
    position: 'fixed',
    left: `${position.x}px`,
    top: `${position.y}px`,
    zIndex: 9999,
    cursor: isDragging ? 'grabbing' : 'grab'
  } as React.CSSProperties : undefined;

  return (
    <div className="fixed z-[9999]" style={style} ref={menuRef}>
      {/* Menu Dropdown */}
      {isUserSwitcherOpen && (
        <div className="absolute bottom-16 right-0 w-52 bg-white rounded-lg shadow-lg overflow-hidden mb-2 border border-gray-200">
          <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <span className="font-medium text-sm">Trocar usuário</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              onClick={closeUserSwitcher}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="p-2 max-h-60 overflow-y-auto">
            {Object.entries(roleLabels).map(([role, label]) => (
              <Button
                key={role}
                variant="ghost"
                className={`w-full justify-start mb-1 ${
                  currentUser?.role === role ? "bg-gray-100" : ""
                }`}
                onClick={() => switchUser(role as any)}
              >
                <div className="flex items-center">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center mr-2 ${roleColors[role as keyof typeof roleColors]}`}>
                    {roleIcons[role as keyof typeof roleIcons]}
                  </div>
                  <span>{label}</span>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}
      
      {/* Botão principal - fixed display for all screen sizes */}
      <Button
        onClick={handleButtonClick}
        onMouseDown={handleMouseDown}
        className={`rounded-full shadow-lg flex items-center gap-2 ${
          roleColors[currentUser?.role || 'visitor'] || roleColors.visitor
        }`}
      >
        <span className="flex items-center gap-2">
          {roleIcons[currentUser?.role || 'visitor']}
          {!isMobile && <span className="hidden sm:inline">{roleLabels[currentUser?.role || 'visitor']}</span>}
        </span>
        {!isMobile && (isUserSwitcherOpen ? 
          <ChevronDown className="h-4 w-4" /> : 
          <ChevronUp className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

export default UserSwitcher;
