import React, { useState, useEffect } from 'react';
import MenuGrid from '@/components/MenuGrid';
import CategoryFilter from '@/components/CategoryFilter';
import { Product } from '@/types/supabase';
import { supabase } from '@/integrations/supabase/client';
import { menuItems as fallbackMenuItems } from '@/data/menuItems';
import { categories } from '@/data/menuItems';

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [products, setProducts] = useState<Product[]>(fallbackMenuItems);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Tentar carregar produtos do Supabase
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('available', true);

        if (error) {
          console.error('Erro ao buscar produtos:', error);
          // Em caso de erro, mantém os produtos locais como fallback
        } else if (data && data.length > 0) {
          // Se encontrar dados no Supabase, use-os
          // Adicionando restaurant_id padrão se não existir
          const productsWithRestaurantId = data.map(product => {
            // Check if product already has restaurant_id
            if ('restaurant_id' in product) {
              return product as Product;
            }
            // Otherwise add it
            return {
              ...product,
              restaurant_id: 1, // Definindo um valor padrão
            } as Product;
          });
          
          setProducts(productsWithRestaurantId);
        } else {
          console.log('Nenhum produto encontrado no Supabase, usando dados locais.');
          // Se não encontrar produtos, mantenha os produtos locais
        }
      } catch (err) {
        console.error('Erro ao buscar produtos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredItems = selectedCategory === 'todos'
    ? products
    : products.filter(item => item.category === selectedCategory);
  
  return (
    <div className="min-h-screen flex flex-col pt-16">
      <main className="flex-grow container mx-auto px-4 py-8">
        <section className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-menu-secondary">Cardápio Digital</h1>
          <p className="text-gray-600 max-w-2xl">
            Explore nosso delicioso menu com opções para todos os gostos. Adicione itens ao seu carrinho e faça seu pedido facilmente.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-menu-secondary">Categorias</h2>
          <CategoryFilter 
            selectedCategory={selectedCategory} 
            onCategoryChange={setSelectedCategory} 
          />
        </section>
        
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-menu-secondary">
              {selectedCategory === 'todos' ? 'Todos os itens' : 
                selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
            </h2>
            <span className="text-sm text-gray-500">{filteredItems.length} itens</span>
          </div>
          
          {loading ? (
            <div className="py-10 text-center">
              <p className="text-gray-500">Carregando produtos...</p>
            </div>
          ) : (
            <MenuGrid items={filteredItems} />
          )}
        </section>
      </main>
      
      <footer className="bg-menu-secondary text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-6 md:mb-0">
              <h2 className="text-xl font-bold mb-4">Cardápio<span className="text-menu-accent">Digital</span></h2>
              <p className="text-gray-300 max-w-xs">
                O melhor cardápio digital para o seu estabelecimento.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="font-semibold mb-3 text-menu-accent">Navegação</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-300 hover:text-white">Home</a></li>
                  <li><a href="#" className="text-gray-300 hover:text-white">Cardápio</a></li>
                  <li><a href="#" className="text-gray-300 hover:text-white">Promoções</a></li>
                  <li><a href="#" className="text-gray-300 hover:text-white">Contato</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3 text-menu-accent">Horários</h3>
                <ul className="space-y-2">
                  <li className="text-gray-300">Seg-Sex: 11h - 22h</li>
                  <li className="text-gray-300">Sáb-Dom: 11h - 23h</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3 text-menu-accent">Contato</h3>
                <ul className="space-y-2">
                  <li className="text-gray-300">(11) 9999-9999</li>
                  <li className="text-gray-300">contato@cardapiodigital.com</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>© {new Date().getFullYear()} CardápioDigital. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
