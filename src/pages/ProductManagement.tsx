import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Search, Star } from 'lucide-react';
import { useUserSwitcher } from '@/context/UserSwitcherContext';
import { toast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { menuItems } from '@/data/menuItems';
import { Product } from '@/types/supabase';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from '@/components/ui/carousel';
import MultipleImageUpload from '@/components/MultipleImageUpload';
import { supabase } from "@/integrations/supabase/client";

interface ProductFormState {
  name: string;
  price: string;
  description: string;
  category: string;
  available: boolean;
  featured: boolean;
  images: string[];
  ingredients: string;
}

// Defining a type for the Supabase returned data
interface SupabaseProduct {
  available: boolean;
  category: string;
  created_at: string;
  description: string;
  featured: boolean;
  id: number;
  image_url: string;
  name: string;
  nutritional_info: any;
  price: number;
  rating: number;
  review_count: number;
  updated_at: string;
  restaurant_id?: number;
  images: string[];
}

const ProductManagement = () => {
  const navigate = useNavigate();
  const { currentUser } = useUserSwitcher();
  const [products, setProducts] = useState<Product[]>([...menuItems]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddEditDialog, setShowAddEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [formState, setFormState] = useState<ProductFormState>({
    name: '',
    price: '',
    description: '',
    category: 'pratos_principais',
    available: true,
    featured: false,
    images: [''],
    ingredients: ''
  });
  
  const isAdminOrOwner = ['admin', 'restaurant_owner'].includes(currentUser?.role || '');
  
  useEffect(() => {
    // Buscar produtos do Supabase se disponível
    fetchProductsFromSupabase();
  }, []);
  
  const fetchProductsFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*');
        
      if (error) {
        console.error('Erro ao buscar produtos do Supabase:', error);
        return;
      }
      
      if (data && data.length > 0) {
        // Adicionar restaurant_id padrão como 1 se não existir
        const productsWithRestaurantId = data.map((product: SupabaseProduct) => ({
          ...product,
          restaurant_id: product.restaurant_id || 1,
          // Assegura que sempre haja um array de imagens: usa images ou fallback para image_url
          images: Array.isArray(product.images) && product.images.length > 0
            ? product.images
            : [product.image_url || '/placeholder.svg']
        })) as Product[];
        
        setProducts(productsWithRestaurantId);
      }
    } catch (error) {
      console.error('Erro ao processar dados do Supabase:', error);
    }
  };

  const resetForm = () => {
    setFormState({
      name: '',
      price: '',
      description: '',
      category: 'pratos_principais',
      available: true,
      featured: false,
      images: [''],
      ingredients: ''
    });
  };
  
  const handleAddProduct = () => {
    resetForm();
    setCurrentProduct(null);
    setShowAddEditDialog(true);
  };
  
  const handleEditProduct = (product: Product) => {
    setCurrentProduct(product);
    setFormState({
      name: product.name,
      price: product.price.toString(),
      description: product.description || '',
      category: product.category || 'pratos_principais',
      available: product.available !== false,
      featured: product.featured || false,
      images: product.images ?? (product.image_url ? [product.image_url] : ['']),
      ingredients: (product.nutritional_info?.ingredients || []).join(', ')
    });
    setShowAddEditDialog(true);
  };
  
  const handleDeleteProduct = (product: Product) => {
    setCurrentProduct(product);
    setShowDeleteDialog(true);
  };
  
  const confirmDelete = async () => {
    if (!currentProduct) return;
    
    // Tentar excluir do Supabase primeiro
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', currentProduct.id);
        
      if (error) {
        console.error('Erro ao excluir produto do Supabase:', error);
        // Continua com o fallback local
      } else {
        toast({
          title: "Produto excluído",
          description: `${currentProduct.name} foi removido com sucesso`,
        });
        
        setProducts(products.filter(p => p.id !== currentProduct.id));
        setShowDeleteDialog(false);
        setCurrentProduct(null);
        return;
      }
    } catch (error) {
      console.error('Erro ao processar exclusão de produto:', error);
    }
    
    // Fallback local
    setProducts(products.filter(p => p.id !== currentProduct.id));
    toast({
      title: "Produto excluído",
      description: `${currentProduct.name} foi removido com sucesso`,
    });
    setShowDeleteDialog(false);
    setCurrentProduct(null);
  };
  
  const handleSubmitProduct = async () => {
    if (!formState.name || !formState.price || !formState.description) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }
    
    const price = parseFloat(formState.price.replace(',', '.'));
    if (isNaN(price)) {
      toast({
        title: "Preço inválido",
        description: "Por favor, insira um valor válido para o preço.",
        variant: "destructive"
      });
      return;
    }
    
    const productData: Product = {
      id: currentProduct ? currentProduct.id : Date.now(),
      name: formState.name,
      description: formState.description,
      price: price,
      category: formState.category,
      available: formState.available,
      featured: formState.featured,
      image_url: formState.images[0] || '/placeholder.svg',
      images: formState.images,
      restaurant_id: 1, // Definindo restaurant_id padrão como 1
      nutritional_info: {
        ingredients: formState.ingredients.split(',').map(i => i.trim()).filter(Boolean)
      }
    };
    
    // Tentar salvar no Supabase primeiro
    try {
      if (currentProduct) {
        // Atualizar produto existente
        const { error } = await supabase
          .from('products')
          .update({
            name: productData.name,
            description: productData.description,
            price: productData.price,
            category: productData.category,
            available: productData.available,
            featured: productData.featured,
            image_url: productData.image_url,
            images: productData.images,
            nutritional_info: productData.nutritional_info,
            restaurant_id: productData.restaurant_id,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentProduct.id);
          
        if (error) {
          console.error('Erro ao atualizar produto no Supabase:', error);
          // Continua com o fallback local
        } else {
          toast({
            title: "Produto atualizado",
            description: `${formState.name} foi atualizado com sucesso`,
          });
          
          setProducts(products.map(p => p.id === currentProduct.id ? productData : p));
          setShowAddEditDialog(false);
          resetForm();
          setCurrentProduct(null);
          fetchProductsFromSupabase();
          return;
        }
      } else {
        // Adicionar novo produto
        const { data, error } = await supabase
          .from('products')
          .insert([{
            name: productData.name,
            description: productData.description,
            price: productData.price,
            category: productData.category,
            available: productData.available,
            featured: productData.featured,
            image_url: productData.image_url,
            images: productData.images,
            nutritional_info: productData.nutritional_info,
            restaurant_id: productData.restaurant_id
          }])
          .select();
          
        if (error) {
          console.error('Erro ao adicionar produto no Supabase:', error);
          // Continua com o fallback local
        } else if (data) {
          toast({
            title: "Produto adicionado",
            description: `${formState.name} foi adicionado com sucesso`,
          });
          
          // Convertendo explicitamente para o tipo Product
          const newProduct: Product = {
            ...(data[0] as SupabaseProduct),
            restaurant_id: (data[0] as SupabaseProduct).restaurant_id || 1
          };
          
          setProducts([...products, newProduct]);
          setShowAddEditDialog(false);
          resetForm();
          setCurrentProduct(null);
          fetchProductsFromSupabase();
          return;
        }
      }
    } catch (error) {
      console.error('Erro ao processar produto no Supabase:', error);
    }
    
    // Fallback local
    if (currentProduct) {
      setProducts(products.map(p => p.id === currentProduct.id ? productData : p));
      toast({
        title: "Produto atualizado",
        description: `${formState.name} foi atualizado com sucesso`,
      });
    } else {
      setProducts([...products, productData]);
      toast({
        title: "Produto adicionado",
        description: `${formState.name} foi adicionado com sucesso`,
      });
    }
    
    setShowAddEditDialog(false);
    resetForm();
    setCurrentProduct(null);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormState(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleImagesChange = (urls: string[]) => {
    setFormState(prev => ({ ...prev, images: urls }));
  };
  
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const categories = [
    { id: 'todos', name: 'Todos' },
    { id: 'pratos_principais', name: 'Pratos Principais' },
    { id: 'bebidas', name: 'Bebidas' },
    { id: 'sobremesas', name: 'Sobremesas' },
    { id: 'entradas', name: 'Entradas' },
    { id: 'acompanhamentos', name: 'Acompanhamentos' }
  ];

  if (!isAdminOrOwner) {
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
                Esta página é destinada apenas para administradores e proprietários.
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

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Gerenciamento de Produtos</h1>
            <p className="text-gray-600">Gerencie o cardápio do restaurante</p>
          </div>
          <Button 
            onClick={handleAddProduct}
            className="mt-4 md:mt-0 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Adicionar Produto
          </Button>
        </div>
        
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Pesquisar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="todos" className="w-full">
          <TabsList className="mb-4 flex w-full overflow-x-auto">
            {categories.map(category => (
              <TabsTrigger key={category.id} value={category.id} className="flex-shrink-0">
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {categories.map(category => (
            <TabsContent key={category.id} value={category.id} className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts
                  .filter(product => category.id === 'todos' || product.category === category.id)
                  .map(product => (
                    <Card key={product.id} className="overflow-hidden">
                      <div className="aspect-video relative">
                        <img 
                          src={product.image_url || "/placeholder.svg"} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 flex gap-1">
                          {product.featured && (
                            <Badge className="bg-yellow-500">Destaque</Badge>
                          )}
                          {product.available === false && (
                            <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                              Indisponível
                            </Badge>
                          )}
                        </div>
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex justify-between items-center">
                          {product.name}
                          <span className="text-base font-normal">
                            R$ {product.price.toFixed(2)}
                          </span>
                        </CardTitle>
                        <CardDescription>
                          {product.nutritional_info?.ingredients?.length > 0 ? (
                            <span className="text-xs text-gray-500">
                              Ingredientes: {product.nutritional_info.ingredients.join(', ')}
                            </span>
                          ) : null}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>
                      </CardContent>
                      <CardContent className="pt-0 flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Edit className="h-4 w-4 mr-2" /> Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteProduct(product)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Excluir
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
              </div>
              
              {filteredProducts.filter(product => category.id === 'todos' || product.category === category.id).length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">Nenhum produto encontrado nesta categoria.</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
      
      <Dialog open={showAddEditDialog} onOpenChange={setShowAddEditDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {currentProduct ? 'Editar Produto' : 'Adicionar Novo Produto'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Nome do Produto*</Label>
                <Input
                  id="name"
                  name="name"
                  value={formState.name}
                  onChange={handleInputChange}
                  placeholder="Ex: X-Burguer Especial"
                />
              </div>
              
              <div>
                <Label htmlFor="price">Preço*</Label>
                <Input
                  id="price"
                  name="price"
                  type="text"
                  inputMode="decimal"
                  value={formState.price}
                  onChange={handleInputChange}
                  placeholder="Ex: 29,90"
                />
              </div>
              
              <div>
                <Label htmlFor="category">Categoria*</Label>
                <select
                  id="category"
                  name="category"
                  value={formState.category}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="pratos_principais">Pratos Principais</option>
                  <option value="bebidas">Bebidas</option>
                  <option value="sobremesas">Sobremesas</option>
                  <option value="entradas">Entradas</option>
                  <option value="acompanhamentos">Acompanhamentos</option>
                </select>
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="description">Descrição do Produto*</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formState.description}
                  onChange={handleInputChange}
                  placeholder="Descreva o produto detalhadamente..."
                  rows={3}
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="ingredients">Ingredientes (separados por vírgula)</Label>
                <Textarea
                  id="ingredients"
                  name="ingredients"
                  value={formState.ingredients}
                  onChange={handleInputChange}
                  placeholder="Ex: Pão, carne, queijo, alface, tomate"
                  rows={2}
                />
              </div>
              
              <div className="col-span-2">
                <Label className="mb-2 block">Imagens do Produto (até 5 imagens)</Label>
                <p className="text-sm text-gray-500 mb-4">
                  A primeira imagem será usada como thumbnail no cardápio.
                </p>
                
                <MultipleImageUpload
                  values={formState.images.filter(img => img !== '')}
                  onImagesUpload={handleImagesChange}
                  maxImages={5}
                  label="Selecionar imagens"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="available" 
                  checked={formState.available}
                  onCheckedChange={(checked) => handleSwitchChange('available', checked)}
                />
                <Label htmlFor="available">Produto Disponível</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="featured" 
                  checked={formState.featured}
                  onCheckedChange={(checked) => handleSwitchChange('featured', checked)}
                />
                <Label htmlFor="featured">Destaque no Cardápio</Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitProduct} type="button">
              {currentProduct ? 'Salvar Alterações' : 'Adicionar Produto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <p>
            Tem certeza que deseja excluir o produto "{currentProduct?.name}"? Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductManagement;
