import { useState, useEffect } from 'react';

export interface CartItem {
  productId: number;
  name: string;
  brand: string | null;
  price: string;
  discountPercent?: string | null;
  selectedSize: string;
  quantity: number;
  imageUrl: string | null;
  storeSlug: string;
  storeName: string;
  currency: string | null;
}

const CART_STORAGE_KEY = 'katail_cart';

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      try {
        setCart(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load cart from localStorage:', e);
        setCart([]);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }
  }, [cart, isLoaded]);

  const addToCart = (item: CartItem) => {
    setCart(prevCart => {
      // Check if item already exists (same product, size, store)
      const existingIndex = prevCart.findIndex(
        c =>
          c.productId === item.productId &&
          c.selectedSize === item.selectedSize &&
          c.storeSlug === item.storeSlug
      );

      if (existingIndex >= 0) {
        // Increase quantity
        const updated = [...prevCart];
        updated[existingIndex].quantity += item.quantity;
        return updated;
      } else {
        // Add new item
        return [...prevCart, item];
      }
    });
  };

  const removeFromCart = (productId: number, size: string, storeSlug: string) => {
    setCart(prevCart =>
      prevCart.filter(
        item =>
          !(item.productId === productId && item.selectedSize === size && item.storeSlug === storeSlug)
      )
    );
  };

  const updateQuantity = (productId: number, size: string, storeSlug: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, size, storeSlug);
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.productId === productId && item.selectedSize === size && item.storeSlug === storeSlug
            ? { ...item, quantity }
            : item
        )
      );
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => {
      const price = parseFloat(item.price);
      const discount = item.discountPercent ? parseFloat(item.discountPercent) : 0;
      const finalPrice = discount > 0 ? price * (1 - discount / 100) : price;
      return sum + finalPrice * item.quantity;
    }, 0);
  };

  // Group items by store
  const getItemsByStore = () => {
    const grouped: { [key: string]: CartItem[] } = {};
    cart.forEach(item => {
      if (!grouped[item.storeSlug]) {
        grouped[item.storeSlug] = [];
      }
      grouped[item.storeSlug].push(item);
    });
    return grouped;
  };

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    getItemsByStore,
    isLoaded,
  };
}
