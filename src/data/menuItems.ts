
import { Product } from '@/types/supabase';

export const menuItems: Product[] = [
  {
    id: 1,
    name: "Hambúrguer Clássico",
    description: "Hambúrguer de carne bovina, queijo cheddar, alface, tomate e molho especial",
    price: 25.90,
    image_url: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?q=80&w=1115&auto=format&fit=crop",
    category: "hamburgueres",
    featured: true,
    available: true,
    restaurant_id: 1,
    nutritional_info: {
      ingredients: ["Pão", "Carne bovina", "Queijo cheddar", "Alface", "Tomate", "Molho especial"]
    }
  },
  {
    id: 2,
    name: "Pizza Margherita",
    description: "Molho de tomate, mussarela de búfala, manjericão fresco e azeite",
    price: 45.00,
    image_url: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?q=80&w=1170&auto=format&fit=crop",
    category: "pizzas",
    available: true,
    restaurant_id: 1,
    nutritional_info: {
      ingredients: ["Massa de pizza", "Molho de tomate", "Mussarela de búfala", "Manjericão fresco", "Azeite"]
    }
  },
  {
    id: 3,
    name: "Salada Caesar",
    description: "Alface romana, croutons, parmesão e molho caesar",
    price: 22.50,
    image_url: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?q=80&w=1170&auto=format&fit=crop",
    category: "saladas",
    available: true,
    restaurant_id: 1,
    nutritional_info: {
      ingredients: ["Alface romana", "Croutons", "Queijo parmesão", "Molho caesar"]
    }
  },
  {
    id: 4,
    name: "Macarrão à Carbonara",
    description: "Espaguete, bacon, ovo, queijo parmesão e pimenta preta",
    price: 36.90,
    image_url: "https://images.unsplash.com/photo-1612874742237-6526221588e3?q=80&w=1171&auto=format&fit=crop",
    category: "massas",
    available: true,
    restaurant_id: 1,
    nutritional_info: {
      ingredients: ["Espaguete", "Bacon", "Ovo", "Queijo parmesão", "Pimenta preta"]
    }
  },
  {
    id: 5,
    name: "Sushi Combo",
    description: "10 peças variadas de sushi e sashimi",
    price: 58.00,
    image_url: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=1170&auto=format&fit=crop",
    category: "japonesa",
    available: true,
    restaurant_id: 1,
    nutritional_info: {
      ingredients: ["Arroz", "Peixe fresco variado", "Alga nori", "Wasabi", "Gengibre"]
    }
  },
  {
    id: 6,
    name: "Filé Mignon",
    description: "Filé mignon grelhado, acompanhado de batata rústica e molho de vinho",
    price: 72.90,
    image_url: "https://images.unsplash.com/photo-1558030006-450675393462?q=80&w=1031&auto=format&fit=crop",
    category: "carnes",
    featured: true,
    available: true,
    restaurant_id: 1,
    nutritional_info: {
      ingredients: ["Filé mignon", "Batata rústica", "Molho de vinho", "Ervas"]
    }
  },
  {
    id: 7,
    name: "Burrito Vegetariano",
    description: "Tortilla de trigo, feijão, arroz, queijo, guacamole e pico de gallo",
    price: 28.50,
    image_url: "https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?q=80&w=1194&auto=format&fit=crop",
    category: "mexicana",
    available: true,
    restaurant_id: 1,
    nutritional_info: {
      ingredients: ["Tortilla de trigo", "Feijão", "Arroz", "Queijo", "Guacamole", "Pico de gallo"]
    }
  },
  {
    id: 8,
    name: "Frango à Parmegiana",
    description: "Filé de frango empanado, coberto com molho de tomate e queijo gratinado",
    price: 39.90,
    image_url: "https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?q=80&w=1170&auto=format&fit=crop",
    category: "carnes",
    available: true,
    restaurant_id: 1,
    nutritional_info: {
      ingredients: ["Filé de frango", "Farinha de rosca", "Molho de tomate", "Queijo mussarela"]
    }
  },
  {
    id: 9,
    name: "Risoto de Cogumelos",
    description: "Arroz arbóreo, mix de cogumelos, vinho branco e parmesão",
    price: 42.00,
    image_url: "https://images.unsplash.com/photo-1534422646206-20bfb3e6fb3c?q=80&w=1169&auto=format&fit=crop",
    category: "massas",
    available: true,
    restaurant_id: 1,
    nutritional_info: {
      ingredients: ["Arroz arbóreo", "Mix de cogumelos", "Vinho branco", "Queijo parmesão"]
    }
  },
  {
    id: 10,
    name: "Brownie com Sorvete",
    description: "Brownie de chocolate quentinho com sorvete de baunilha",
    price: 18.90,
    image_url: "https://images.unsplash.com/photo-1564988208929-32932df0b42d?q=80&w=1170&auto=format&fit=crop",
    category: "sobremesas",
    featured: true,
    available: true,
    restaurant_id: 1,
    nutritional_info: {
      ingredients: ["Chocolate", "Farinha", "Açúcar", "Ovos", "Sorvete de baunilha"]
    }
  }
];

export const categories = [
  { id: 'todos', name: 'Todos' },
  { id: 'hamburgueres', name: 'Hambúrgueres' },
  { id: 'pizzas', name: 'Pizzas' },
  { id: 'saladas', name: 'Saladas' },
  { id: 'massas', name: 'Massas' },
  { id: 'carnes', name: 'Carnes' },
  { id: 'japonesa', name: 'Japonesa' },
  { id: 'mexicana', name: 'Mexicana' },
  { id: 'sobremesas', name: 'Sobremesas' }
];
