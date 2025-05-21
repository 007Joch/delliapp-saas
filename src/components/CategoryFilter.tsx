
import React from 'react';
import { Button } from '@/components/ui/button';
import { categories } from '@/data/menuItems';

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ 
  selectedCategory,
  onCategoryChange 
}) => {
  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex space-x-2 min-w-max">
        {categories.map(category => (
          <Button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            variant={selectedCategory === category.id ? "default" : "outline"}
            className={`px-4 py-2 whitespace-nowrap ${
              selectedCategory === category.id 
                ? "bg-menu-primary text-white" 
                : "text-gray-700 hover:text-menu-primary"
            }`}
          >
            {category.name}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;
