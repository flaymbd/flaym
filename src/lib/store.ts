import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string; // product id
  name: string;
  price: number;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  isCartOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  setCartOpen: (open: boolean) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isCartOpen: false,
      addItem: (newItem) => set((state) => {
        const existing = state.items.find((i) => i.id === newItem.id);
        if (existing) {
          return {
            items: state.items.map((i) =>
              i.id === newItem.id ? { ...i, quantity: i.quantity + newItem.quantity } : i
            ),
          };
        }
        return { items: [...state.items, newItem] };
      }),
      removeItem: (id) => set((state) => ({
        items: state.items.filter((i) => i.id !== id)
      })),
      updateQuantity: (id, quantity) => set((state) => ({
        items: state.items.map((i) => i.id === id ? { ...i, quantity } : i)
      })),
      clearCart: () => set({ items: [] }),
      getTotal: () => get().items.reduce((total, item) => total + item.price * item.quantity, 0),
      setCartOpen: (open) => set({ isCartOpen: open }),
    }),
    {
      name: 'flaym-cart',
    }
  )
);
