import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../lib/store';

export default function CartPage() {
  const navigate = useNavigate();
  const setCartOpen = useCartStore(state => state.setCartOpen);

  useEffect(() => {
    setCartOpen(true);
    navigate('/menu', { replace: true });
  }, [navigate, setCartOpen]);

  return null;
}
