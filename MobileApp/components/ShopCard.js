import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';

const ShopCard = ({ shop, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(shop)}>
      <View style={styles.imageContainer}>
        {shop.picture ? (
          <Image 
            source={{ uri: shop.picture }} 
            style={styles.image}
            resizeMode="cover"
            onError={(error) => console.log('Shop image error:', error)}
            onLoad={() => console.log('Shop image loaded successfully')}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderEmoji}>🏪</Text>
            <Text style={styles.debugText}>No picture: {shop.name}</Text>
          </View>
        )}
        
        {/* New tag */}
        <View style={styles.newTag}>
          <Text style={styles.newTagText}>New</Text>
        </View>
        
        {/* Heart icon */}
        <TouchableOpacity style={styles.heartButton}>
          <Text style={styles.heartIcon}>🤍</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <View style={styles.shopInfo}>
          <View style={styles.shopLogo}>
            <Text style={styles.logoText}>{shop.name?.charAt(0) || 'S'}</Text>
          </View>
          <Text style={styles.shopName} numberOfLines={1}>
            {shop.name}
          </Text>
        </View>
        
        <Text style={styles.collectionTime}>
          {shop.opening_hours || '08:00 - 23:00'}
        </Text>
        
        <View style={styles.ratingRow}>
          <Text style={styles.starEmoji}>⭐</Text>
          <Text style={styles.rating}>4.5</Text>
          <Text style={styles.separator}>|</Text>
          <Text style={styles.distance}>{shop.address}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 8,
    marginVertical: 4,
    width: 220,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 40,
  },
  newTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newTagText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  heartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartIcon: {
    fontSize: 16,
  },
  content: {
    padding: 12,
  },
  shopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  shopLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  logoText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  shopName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  collectionTime: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  rating: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  separator: {
    fontSize: 12,
    color: '#ccc',
    marginHorizontal: 4,
  },
  distance: {
    fontSize: 12,
    color: '#666',
  },
  debugText: {
    fontSize: 8,
    color: '#999',
    textAlign: 'center',
    marginTop: 2,
  },
});

export default ShopCard; 