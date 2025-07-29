import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';

import ProductCard from '../../components/ProductCard';
import { shopsAPI } from '../../api/api';
import { useCart } from '../../context/CartContext';

const ShopProductsScreen = ({ route, navigation }) => {
  const { shop } = route.params;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    loadProducts();
  }, [shop.id]);

  const loadProducts = async () => {
    try {
      const response = await shopsAPI.getShopProducts(shop.id);
      console.log('Products response:', response.data);
      setProducts(response.data);
    } catch (error) {
      console.log('Error loading products:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product, quantity, shop) => {
    console.log('ShopProductsScreen handleAddToCart:', { product, quantity, shop });
    addToCart(product, quantity, shop);
    Alert.alert('Success', `${quantity}x ${product.name} added to cart`);
  };

  const renderProduct = ({ item }) => {
    console.log('Rendering product:', item, 'with shop:', shop);
    return (
      <ProductCard product={item} onAddToCart={handleAddToCart} shop={shop} />
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.shopHeader}>
        <Text style={styles.shopName}>{shop.name}</Text>
        <Text style={styles.shopCategory}>{shop.category?.name || 'Uncategorized'}</Text>
      </View>

      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => (item?.id || Math.random()).toString()}
        contentContainerStyle={styles.productsList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopHeader: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  shopName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  shopCategory: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
  },
  productsList: {
    paddingVertical: 8,
  },
});

export default ShopProductsScreen; 