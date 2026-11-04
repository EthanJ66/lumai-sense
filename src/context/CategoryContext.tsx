import React, { createContext, useContext, useState, ReactNode } from 'react';

// 分类ID：城市管理、道路巡检、能源供应、碳封存、数字生活、行业应用
export type CategoryId = 'home' | 'city' | 'health' | 'energy' | 'carbon' | 'life' | 'industry';

interface CategoryContextType {
  activeCategory: CategoryId;
  setActiveCategory: (id: CategoryId) => void;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export const CategoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeCategory, setActiveCategory] = useState<CategoryId>('home');

  return (
    <CategoryContext.Provider value={{ activeCategory, setActiveCategory }}>
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategory = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategory must be used within CategoryProvider');
  }
  return context;
};
