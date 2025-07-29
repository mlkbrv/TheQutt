import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { formatPrice } from '../utils/helpers';

const ProductCard = ({ product, onAddToCart, shop }) => {
  const [quantity, setQuantity] = useState(1);
  const available = product.quantity > 0;

  const handleQuantityChange = (increment) => {
    const newQuantity = quantity + increment;
    if (newQuantity >= 1 && newQuantity <= product.quantity) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    if (!available) {
      Alert.alert('Mövcud deyil', 'Bu məhsul hal-hazırda mövcud deyil.');
      return;
    }
    
    console.log('Adding to cart:', { product, quantity, shop });
    onAddToCart(product, quantity, shop);
    setQuantity(1);
  };

  return (
    <View style={[styles.card, !available && styles.unavailableCard]}>
      <View style={styles.imageContainer}>
        {product.picture ? (
          <Image 
            source={{ uri: product.picture }} 
            style={styles.image}
            resizeMode="cover"
            onError={(error) => console.log('Image error:', error)}
            onLoad={() => console.log('Image loaded successfully')}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderEmoji}>🍔</Text>
            <Text style={styles.debugText}>No picture: {product.name}</Text>
          </View>
        )}
        {!available && (
          <View style={styles.unavailableOverlay}>
            <Text style={styles.unavailableText}>Mövcud deyil</Text>
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        
        <Text style={styles.description} numberOfLines={3}>
          {product.description}
        </Text>
        
        <View style={styles.priceRow}>
          <Text style={styles.price}>
            {formatPrice(product.price)}
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.emoji}>📦</Text>
          <Text style={styles.quantity}>
            Mövcud: {product.quantity}
          </Text>
        </View>
        
        <View style={styles.quantityRow}>
          <Text style={styles.quantityLabel}>Miqdar:</Text>
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={[styles.quantityButton, !available && styles.disabledButton]}
              onPress={() => handleQuantityChange(-1)}
              disabled={!available}
            >
              <Text style={[styles.quantityEmoji, !available && styles.disabledEmoji]}>➖</Text>
            </TouchableOpacity>
            
            <Text style={styles.quantityText}>{quantity}</Text>
            
            <TouchableOpacity
              style={[styles.quantityButton, !available && styles.disabledButton]}
              onPress={() => handleQuantityChange(1)}
              disabled={!available}
            >
              <Text style={[styles.quantityEmoji, !available && styles.disabledEmoji]}>➕</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.addButton, !available && styles.disabledButton]}
          onPress={handleAddToCart}
          disabled={!available}
        >
          <Text style={styles.cartEmoji}>🛒</Text>
          <Text style={styles.addButtonText}>Səbətə əlavə et</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  unavailableCard: {
    opacity: 0.6,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 12,
  },
  placeholderImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 40,
  },
  unavailableOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unavailableText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  price: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginRight: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  emoji: {
    fontSize: 16,
    marginRight: 4,
  },
  quantity: {
    fontSize: 14,
    color: '#666',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  disabledButton: {
    borderColor: '#ccc',
    backgroundColor: '#f5f5f5',
  },
  quantityEmoji: {
    fontSize: 16,
    color: '#4CAF50',
  },
  disabledEmoji: {
    color: '#ccc',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 16,
    color: '#333',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  cartEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  debugText: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default ProductCard; 