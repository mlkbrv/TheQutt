import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { API_CONFIG, getAuthHeaders } from '../config/api';

export const useUserRole = () => {
  const { token } = useAuth();
  const [isShopOwner, setIsShopOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [myShops, setMyShops] = useState([]);

  useEffect(() => {
    if (token) {
      checkUserRole();
    } else {
      setIsShopOwner(false);
      setIsLoading(false);
    }
  }, [token]);

  const checkUserRole = async () => {
    try {
      setIsLoading(true);
      
      // Проверяем, есть ли у пользователя магазины
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}/products/my-shops/`,
        { headers: getAuthHeaders(token) }
      );
      
      const shops = response.data;
      setIsShopOwner(shops.length > 0);
      setMyShops(shops);
      
      console.log('🔍 İstifadəçi rolu yoxlanıldı:', {
        isShopOwner: shops.length > 0,
        shopsCount: shops.length,
        shops: shops.map(s => ({ id: s.id, name: s.name }))
      });
      
    } catch (error) {
      console.log('🔍 İstifadəçi mağaza sahibi deyil və ya xəta baş verdi:', error.message);
      setIsShopOwner(false);
      setMyShops([]);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshRole = () => {
    checkUserRole();
  };

  return {
    isShopOwner,
    isLoading,
    myShops,
    refreshRole
  };
};
