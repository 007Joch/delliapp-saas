import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, MinusCircle, MessageSquarePlus } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { toast } from '@/hooks/use-toast';
import { Product } from '@/types/supabase';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from '@/components/ui/carousel';

interface ProductDetailsDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Lista real de imagens para o carrossel
const getProductImages = (product: Product) => {
  if (Array.isArray(product.images) && product.images.length > 0) {
    return product.images;
  }
  return [product.image_url || '/placeholder.svg'];
};

const ProductDetailsDialog: React.FC<ProductDetailsDialogProps> = ({ product, open, onOpenChange }) => {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [showNotesField, setShowNotesField] = useState(false);
  const { addToCart } = useCart();

  if (!product) return null;

  const handleIncreaseQuantity = () => setQuantity(prev => prev + 1);
  const handleDecreaseQuantity = () => setQuantity(prev => prev > 1 ? prev - 1 : 1);
  
  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name, 
      price: product.price,
      image: product.image_url,
      imageUrl: product.image_url,
      description: product.description,
      category: product.category,
      quantity,
      notes: notes.trim() || undefined
    });
    
    toast({
      title: "Item adicionado ao carrinho",
      description: `${quantity}x ${product.name} foi adicionado ao seu pedido`,
    });
    
    onOpenChange(false);
    setNotes('');
    setQuantity(1);
    setShowNotesField(false);
  };
  
  const toggleNotesField = () => {
    setShowNotesField(prev => !prev);
    if (showNotesField) {
      setNotes('');
    }
  };
  
  const images = getProductImages(product);
  const ingredients = product.nutritional_info?.ingredients || ['Sem informações de ingredientes'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg font-bold">{product.name}</DialogTitle>
          <DialogDescription className="text-base font-medium text-gray-700">
            R$ {product.price.toFixed(2)}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow overflow-y-auto pr-1 pb-20">
          {/* Carrossel de imagens */}
          <div className="relative w-full mb-2">
            <Carousel className="w-full">
              <CarouselContent>
                {images.map((image, index) => (
                  <CarouselItem key={index} className="flex justify-center">
                    <img 
                      src={image} 
                      alt={`${product.name} - imagem ${index + 1}`}
                      className="object-cover rounded-md max-h-[200px] w-auto mx-auto"
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="h-7 w-7 -left-3" />
              <CarouselNext className="h-7 w-7 -right-3" />
            </Carousel>
          </div>
          
          {/* Descrição do produto */}
          <div className="mb-2">
            <h3 className="font-medium text-base mb-1">Descrição</h3>
            <p className="text-gray-700 text-xs">{product.description}</p>
          </div>
          
          {/* Ingredientes */}
          <div className="mb-2">
            <h3 className="font-medium text-base mb-1">Ingredientes</h3>
            <ul className="list-disc pl-4">
              {ingredients.map((ingredient, index) => (
                <li key={index} className="text-gray-700 text-xs">{ingredient}</li>
              ))}
            </ul>
          </div>
          
          {/* Botão para mostrar/ocultar campo de observações */}
          <div className="mb-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleNotesField}
              className="flex items-center gap-1 text-xs h-7 px-2"
            >
              <MessageSquarePlus className="h-3 w-3" />
              {showNotesField ? "Remover observações" : "Adicionar observações"}
            </Button>
            
            {/* Campo de observações (aparece apenas se showNotesField for true) */}
            {showNotesField && (
              <div className="mt-2">
                <Textarea 
                  placeholder="Alguma observação? Ex: sem cebola, sem molho, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs"
                  rows={2}
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Quantidade e botão de adicionar - agora em um container fixo */}
        <div className="pt-3 mt-2 border-t absolute bottom-0 left-0 right-0 bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleDecreaseQuantity}
                disabled={quantity <= 1}
                className="h-7 w-7"
              >
                <MinusCircle className="h-3 w-3" />
              </Button>
              <span className="text-base font-medium">{quantity}</span>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleIncreaseQuantity}
                className="h-7 w-7"
              >
                <PlusCircle className="h-3 w-3" />
              </Button>
            </div>
            
            <Button onClick={handleAddToCart} className="px-3 py-1 h-8 text-xs">
              Adicionar • R$ {(product.price * quantity).toFixed(2)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsDialog;
