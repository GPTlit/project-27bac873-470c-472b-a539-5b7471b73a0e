import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StoreProduct {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  category: string;
  cover_url: string | null;
  price: number;
  currency: string;
  stock_quantity: number | null;
  is_available: boolean | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface StoreOrder {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  total_price: number;
  status: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  product?: StoreProduct;
}

export const useStoreProducts = () => {
  return useQuery({
    queryKey: ['store-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_products')
        .select('*')
        .eq('is_available', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as StoreProduct[];
    },
  });
};

export const useAllStoreProducts = () => {
  return useQuery({
    queryKey: ['store-products-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as StoreProduct[];
    },
  });
};

export const useStoreProduct = (id: string) => {
  return useQuery({
    queryKey: ['store-product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_products')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as StoreProduct | null;
    },
    enabled: !!id,
  });
};

export const useUserOrders = () => {
  return useQuery({
    queryKey: ['user-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_orders')
        .select('*, product:store_products(*)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as StoreOrder[];
    },
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (order: {
      product_id: string;
      quantity: number;
      total_price: number;
      customer_name?: string;
      customer_phone?: string;
      customer_address?: string;
      notes?: string;
      payment_method?: string;
      receipt_url?: string;
      whatsapp_number?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('store_orders')
        .insert({
          ...order,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
    },
  });
};
