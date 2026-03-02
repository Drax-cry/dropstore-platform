import { useState, useCallback, useSyncExternalStore } from 'react';

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
  whatsappNumber: string | null;
}

const CART_STORAGE_KEY = 'katail_cart';

// Singleton cart state manager
class CartStore {
  private listeners: Set<() => void> = new Set();
  private cart: CartItem[] = [];

  constructor() {
    // Load cart synchronously from localStorage on initialization
    this.loadCart();
  }

  private loadCart() {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      this.cart = stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Failed to load cart from localStorage:', e);
      this.cart = [];
    }
  }

  private saveCart() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.cart));
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getSnapshot() {
    return this.cart;
  }

  addToCart(item: CartItem) {
    const existingIndex = this.cart.findIndex(
      c =>
        c.productId === item.productId &&
        c.selectedSize === item.selectedSize &&
        c.storeSlug === item.storeSlug
    );

    if (existingIndex >= 0) {
      this.cart[existingIndex].quantity += item.quantity;
    } else {
      this.cart.push(item);
    }
    this.saveCart();
  }

  removeFromCart(productId: number, size: string, storeSlug: string) {
    this.cart = this.cart.filter(
      item =>
        !(item.productId === productId && item.selectedSize === size && item.storeSlug === storeSlug)
    );
    this.saveCart();
  }

  updateQuantity(productId: number, size: string, storeSlug: string, quantity: number) {
    if (quantity <= 0) {
      this.removeFromCart(productId, size, storeSlug);
    } else {
      const item = this.cart.find(
        c => c.productId === productId && c.selectedSize === size && c.storeSlug === storeSlug
      );
      if (item) {
        item.quantity = quantity;
        this.saveCart();
      }
    }
  }

  clearCart() {
    this.cart = [];
    this.saveCart();
  }

  getTotalItems() {
    return this.cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  getTotalPrice() {
    return this.cart.reduce((sum, item) => {
      const price = parseFloat(item.price);
      const discount = item.discountPercent ? parseFloat(item.discountPercent) : 0;
      const finalPrice = discount > 0 ? price * (1 - discount / 100) : price;
      return sum + finalPrice * item.quantity;
    }, 0);
  }

  getItemsByStore() {
    const grouped: { [key: string]: CartItem[] } = {};
    this.cart.forEach(item => {
      if (!grouped[item.storeSlug]) {
        grouped[item.storeSlug] = [];
      }
      grouped[item.storeSlug].push(item);
    });
    return grouped;
  }
}

// Global cart store instance
const cartStore = new CartStore();

export function useCart() {
  // Use useSyncExternalStore for instant updates without useEffect delays
  const cart = useSyncExternalStore(
    callback => cartStore.subscribe(callback),
    () => cartStore.getSnapshot()
  );

  const addToCart = useCallback((item: CartItem) => {
    cartStore.addToCart(item);
  }, []);

  const removeFromCart = useCallback((productId: number, size: string, storeSlug: string) => {
    cartStore.removeFromCart(productId, size, storeSlug);
  }, []);

  const updateQuantity = useCallback((productId: number, size: string, storeSlug: string, quantity: number) => {
    cartStore.updateQuantity(productId, size, storeSlug, quantity);
  }, []);

  const clearCart = useCallback(() => {
    cartStore.clearCart();
  }, []);

  const getTotalItems = useCallback(() => {
    return cartStore.getTotalItems();
  }, []);

  const getTotalPrice = useCallback(() => {
    return cartStore.getTotalPrice();
  }, []);

  const getItemsByStore = useCallback(() => {
    return cartStore.getItemsByStore();
  }, []);

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    getItemsByStore,
  };
}
