import React from 'react';
import { Category } from '../types';
import { Layers, Shield, Mountain, Box, Grid, Wrench, Sparkles } from 'lucide-react';

interface CategoryPillsProps {
  categories: Category[];
  selectedCategoryId: number | null;
  onSelectCategory: (id: number | null) => void;
}

export const CategoryPills: React.FC<CategoryPillsProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
}) => {
  const getCategoryIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('cement')) return <Layers className="w-4 h-4" />;
    if (lower.includes('steel')) return <Shield className="w-4 h-4" />;
    if (lower.includes('sand') || lower.includes('aggregate')) return <Mountain className="w-4 h-4" />;
    if (lower.includes('brick') || lower.includes('block')) return <Box className="w-4 h-4" />;
    if (lower.includes('tile')) return <Grid className="w-4 h-4" />;
    if (lower.includes('pipe') || lower.includes('plumb')) return <Wrench className="w-4 h-4" />;
    return <Sparkles className="w-4 h-4" />;
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
      <button
        type="button"
        onClick={() => onSelectCategory(null)}
        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
          selectedCategoryId === null
            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
        }`}
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        All Materials
      </button>

      {categories.map((cat) => {
        const isSelected = selectedCategoryId === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
              isSelected
                ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
            }`}
          >
            <span className={isSelected ? 'text-slate-950' : 'text-slate-500'}>
              {getCategoryIcon(cat.name)}
            </span>
            {cat.name}
          </button>
        );
      })}
    </div>
  );
};
