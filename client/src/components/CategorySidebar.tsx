import { useState } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';

export interface Category {
  id: number;
  name: string;
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: number;
  name: string;
  categoryId: number;
}

interface CategorySidebarProps {
  categories: Category[];
  activeCategoryId: number | null;
  activeSubcategoryId: number | null;
  onCategorySelect: (categoryId: number) => void;
  onSubcategorySelect: (subcategoryId: number, categoryId: number) => void;
  primaryColor: string;
}

export function CategorySidebar({
  categories,
  activeCategoryId,
  activeSubcategoryId,
  onCategorySelect,
  onSubcategorySelect,
  primaryColor,
}: CategorySidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(
    new Set(activeCategoryId ? [activeCategoryId] : [])
  );
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleCategory = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleCategoryClick = (categoryId: number) => {
    onCategorySelect(categoryId);
    // Auto-expand the selected category
    const newExpanded = new Set(expandedCategories);
    newExpanded.add(categoryId);
    setExpandedCategories(newExpanded);
  };

  const handleSubcategoryClick = (subcategoryId: number, categoryId: number) => {
    onSubcategorySelect(subcategoryId, categoryId);
    setIsMobileOpen(false);
  };

  const sidebarContent = (
    <div className="space-y-1">
      {categories.map(category => (
        <div key={category.id}>
          {/* Category Button */}
          <button
            onClick={() => handleCategoryClick(category.id)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeCategoryId === category.id
                ? 'text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            style={
              activeCategoryId === category.id
                ? { backgroundColor: primaryColor }
                : {}
            }
          >
            <span>{category.name}</span>
            {category.subcategories.length > 0 && (
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  expandedCategories.has(category.id) ? 'rotate-180' : ''
                }`}
              />
            )}
          </button>

          {/* Subcategories */}
          {expandedCategories.has(category.id) && category.subcategories.length > 0 && (
            <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-0">
              {category.subcategories.map(subcategory => (
                <button
                  key={subcategory.id}
                  onClick={() => handleSubcategoryClick(subcategory.id, category.id)}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-all ${
                    activeSubcategoryId === subcategory.id
                      ? 'text-white font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  style={
                    activeSubcategoryId === subcategory.id
                      ? { backgroundColor: primaryColor }
                      : {}
                  }
                >
                  {subcategory.name}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-40 p-3 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        style={{ backgroundColor: primaryColor }}
      >
        {isMobileOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Menu className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        >
          <div
            className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-lg overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Categorias</h3>
              {sidebarContent}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 bg-white rounded-xl border border-gray-100 p-4 h-fit sticky top-24">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Categorias</h3>
        {sidebarContent}
      </aside>
    </>
  );
}
