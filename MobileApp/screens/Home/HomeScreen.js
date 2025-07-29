import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';

import ShopCard from '../../components/ShopCard';
import { shopsAPI } from '../../api/api';



// Главный экран со списком магазинов
const HomeScreen = ({ navigation }) => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Категории как на скрине
  const categories = [
    { name: 'Coffee shops', emoji: '☕' },
    { name: 'Cafes', emoji: '🎄' },
    { name: 'Restaurants', emoji: '🍽️' },
    { name: 'Bakeries', emoji: '🥐' },
    { name: 'Pizzeria', emoji: '🍕' },
    { name: 'Sushi Bar', emoji: '🍣' },
    { name: 'Fast Food', emoji: '🍔' },
    { name: 'Bar', emoji: '🍺' },
    { name: 'Bakery', emoji: '🥖' },
    { name: 'Cafe', emoji: '☕' }
  ];

  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async () => {
    try {
      const response = await shopsAPI.getShops();
      console.log('Shops response:', response.data);
      setShops(response.data || []);
      
      // Оставляем фиксированные категории как на скрине
    } catch (error) {
      console.log('Error loading shops:', error);
      setShops([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadShops();
    setRefreshing(false);
  };

  const handleShopPress = (shop) => {
    navigation.navigate('ShopProducts', { shop });
  };

  // Группируем магазины по категориям
  const shopsByCategory = categories.map(category => ({
    ...category,
    shops: shops.filter(shop => shop.category?.name === category.name)
  }));

  // Если нет магазинов в категориях, показываем все магазины в первой категории
  if (shops.length > 0 && shopsByCategory.every(cat => cat.shops.length === 0)) {
    shopsByCategory[0].shops = shops;
  }
  
  // Фильтруем только категории с магазинами
  const categoriesWithShops = shopsByCategory.filter(cat => cat.shops.length > 0);

  const renderCategorySection = ({ item }) => (
    <View style={styles.categorySection}>
      <View style={styles.categoryHeader}>
        <View style={styles.categoryTitle}>
          <Text style={styles.categoryEmoji}>{item.emoji}</Text>
          <Text style={styles.categoryName}>{item.name}</Text>
        </View>
        <TouchableOpacity style={styles.seeAllButton}>
          <Text style={styles.seeAllText}>See all {'>'}</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={item.shops}
        renderItem={({ item: shop }) => (
          <ShopCard shop={shop} onPress={handleShopPress} />
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.shopsList}
        keyExtractor={(shop) => shop.id?.toString() || Math.random().toString()}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
      </View>

      <FlatList
        data={categoriesWithShops}
        renderItem={renderCategorySection}
        keyExtractor={(item) => item.name}
        contentContainerStyle={styles.categoriesList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🏪</Text>
            <Text style={styles.emptyText}>No shops found</Text>
            <Text style={styles.emptySubtext}>
              Try refreshing the page or check your connection
            </Text>
            <Text style={styles.debugText}>
              Debug: {shops.length} shops loaded
            </Text>
            {shops.length > 0 && (
              <Text style={styles.debugText}>
                First shop picture: {shops[0]?.picture || 'No picture'}
              </Text>
            )}
          </View>
        }
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
  header: {
    padding: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  categoryTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllButton: {
    paddingHorizontal: 10,
  },
  seeAllText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  shopsList: {
    paddingHorizontal: 10,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyEmoji: {
    fontSize: 50,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  debugText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default HomeScreen; 