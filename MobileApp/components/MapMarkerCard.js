import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';

const MapMarkerCard = ({ shop, onViewProducts }) => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          {shop.picture ? (
            <Image source={{ uri: shop.picture }} style={styles.image} />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderEmoji}>🏪</Text>
            </View>
          )}
        </View>
        
        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={1}>
            {shop.name}
          </Text>
          
          <Text style={styles.category}>
            {shop.category?.name || 'Uncategorized'}
          </Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.emoji}>📍</Text>
            <Text style={styles.address} numberOfLines={1}>
              {shop.address || 'Address not available'}
            </Text>
          </View>
          
          {shop.rating && (
            <View style={styles.ratingContainer}>
              <Text style={styles.emoji}>⭐</Text>
              <Text style={styles.rating}>{shop.rating}</Text>
            </View>
          )}
        </View>
        
        <TouchableOpacity style={styles.button} onPress={() => onViewProducts(shop)}>
          <Text style={styles.buttonText}>View Products</Text>
          <Text style={styles.arrowEmoji}>➡️</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.triangle} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: 280,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  imageContainer: {
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  placeholderImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 30,
  },
  content: {
    marginBottom: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  emoji: {
    fontSize: 12,
    marginRight: 4,
  },
  address: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  button: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 6,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 4,
  },
  arrowEmoji: {
    fontSize: 14,
  },
  triangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'white',
    marginTop: -1,
  },
});

export default MapMarkerCard; 