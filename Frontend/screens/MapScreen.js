import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Image,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { API_CONFIG, getAuthHeaders } from '../config/api';

const MapScreen = ({ navigation }) => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    getUserLocation();
    if (token) {
      fetchShops();
    }
  }, [token]);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Məkan icazəsi verilmədi');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.log('Məkan alma xətası:', error);
    }
  };

  const fetchShops = async () => {
    try {
      setLoading(true);
      console.log('=== MAĞAZA YÜKLƏMƏ BAŞLANIR ===');
      console.log('Mağazalar yüklənir URL-dən:', API_CONFIG.SHOPS_URL);
      console.log('Token:', token ? 'Bəli' : 'Xeyr');
      console.log('Tam URL:', API_CONFIG.SHOPS_URL);
      
      const headers = getAuthHeaders(token);
      console.log('Sorğu başlıqları:', headers);
      
      // Проверяем доступность сервера
      try {
        const testResponse = await axios.get(`${API_CONFIG.BASE_URL}/`, { timeout: 5000 });
        console.log('Server əlçatandır, status:', testResponse.status);
      } catch (testError) {
        console.error('Server əlçatan deyil:', testError.message);
        Alert.alert('Xəta', 'Server əlçatan deyil. Django serverin işlədiyini yoxlayın.');
        setShops([]);
        setLoading(false);
        return;
      }
      
      const response = await axios.get(API_CONFIG.SHOPS_URL, { 
        headers,
        timeout: 10000 
      });

      console.log('=== UĞURLU CAVAB ===');
      console.log('Server cavabı:', response.status, response.statusText);
      console.log('Cavab başlıqları:', response.headers);
      console.log('Yüklənən mağazalar:', response.data);
      
      // Детальное логирование структуры данных
      if (response.data && response.data.length > 0) {
        console.log('=== DƏTALLI MƏLUMAT STRUKTURU ===');
        response.data.forEach((shop, index) => {
          console.log(`Mağaza ${index + 1}:`, {
            id: shop.id,
            name: shop.name,
            category: shop.category,
            location: shop.location,
            hasLocation: !!shop.location,
            latitude: shop.location?.latitude,
            longitude: shop.location?.longitude,
            address: shop.address
          });
        });
      }

      // Фильтруем магазины с валидными координатами
      const validShops = response.data.filter(shop => 
        shop.location && 
        shop.location.latitude && 
        shop.location.longitude && 
        !isNaN(shop.location.latitude) && 
        !isNaN(shop.location.longitude)
      );

      console.log('Shops with valid coordinates:', validShops);
      console.log('=== LOADING COMPLETE ===');
      setShops(validShops);
    } catch (error) {
      console.error('=== LOADING ERROR ===');
      console.error('Full error:', error);
      
      if (error.response) {
        console.error('Error details:', error.response.status, error.response.data);
        console.error('Response headers:', error.response.headers);
        Alert.alert('Xəta', `HTTP ${error.response.status}: ${error.response.statusText}`);
      } else if (error.request) {
        console.error('Request was sent but no response received:', error.request);
        console.error('Request details:', error.request._response);
        Alert.alert('Xəta', 'Server yoxlanılır. Internet bağlantısını yoxlayın.');
      } else {
        console.error('Request setup error:', error.message);
        Alert.alert('Xəta', `Sorğu quraşdırma xətası: ${error.message}`);
      }
      setShops([]);
    } finally {
      setLoading(false);
    }
  };

  const handleShopPress = (shop) => {
    navigation.navigate('ShopProducts', { 
      shopId: shop.id, 
      shopName: shop.name 
    });
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'restaurant': '🍽️',
      'cafe': '☕',
      'shop': '🛍️',
      'bakery': '🥖',
      'fastfood': '🍔',
      'bar': '🍺',
    };
    return icons[category?.toLowerCase()] || '🏪';
  };

  const getCategoryColor = (category) => {
    const colors = {
      'restaurant': '#FF6B6B',
      'cafe': '#4ECDC4',
      'shop': '#45B7D1',
      'bakery': '#96CEB4',
      'fastfood': '#FFEAA7',
      'bar': '#DDA0DD',
    };
    return colors[category?.toLowerCase()] || '#4CAF50';
  };

  // Создаем HTML для карты с Leaflet
  const createMapHTML = () => {
    const initialLat = userLocation?.latitude || 55.7558;
    const initialLng = userLocation?.longitude || 37.6176;
    
    const shopsMarkers = shops.map(shop => {
      const lat = parseFloat(shop.location.latitude);
      const lng = parseFloat(shop.location.longitude);
      const icon = getCategoryIcon(shop.category?.name);
      const color = getCategoryColor(shop.category?.name);
      
      return `
        L.marker([${lat}, ${lng}], {
          icon: L.divIcon({
            html: '<div style="background-color: ${color}; width: 40px; height: 40px; border-radius: 20px; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"><span style="font-size: 20px; color: white;">${icon}</span></div>',
            className: 'custom-marker',
            iconSize: [40, 40],
            iconAnchor: [20, 20]
          })
        })
        .bindPopup(\`
          <div style="text-align: center; min-width: 200px;">
            <h3 style="margin: 0 0 10px 0; color: #333;">${shop.name}</h3>
            <p style="margin: 0 0 5px 0; color: #666;">${shop.description || 'Açıqlama mövcud deyil'}</p>
            <p style="margin: 0 0 5px 0; color: #888;">${shop.category?.name || 'Mağaza'}</p>
            <p style="margin: 0; color: #888;">📍 ${shop.address}</p>
            <button onclick="selectShop('${shop.id}')" style="background: #4CAF50; color: white; border: none; padding: 8px 16px; border-radius: 4px; margin-top: 10px; cursor: pointer;">Məhsulaları baxın</button>
          </div>
        \`)
        .addTo(map);
      `;
    }).join('');

    const userLocationMarker = userLocation ? `
      L.marker([${userLocation.latitude}, ${userLocation.longitude}], {
        icon: L.divIcon({
          html: '<div style="background-color: #4CAF50; width: 30px; height: 30px; border-radius: 15px; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"><span style="font-size: 16px; color: white;">📍</span></div>',
          className: 'custom-marker',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        })
      })
      .bindPopup('<b>Sizin Məkanınız</b>')
      .addTo(map);
    ` : '';

    const shopsBounds = shops.length > 0 ? 
      shops.map(shop => `[${shop.location.latitude}, ${shop.location.longitude}]`).join(',') : 
      '[]';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <style>
            html, body, #map { 
              height: 100%; 
              margin: 0; 
              font-family: Arial, sans-serif;
            }
            .custom-marker {
              background: transparent;
              border: none;
            }
            .leaflet-popup-content {
              margin: 10px;
            }
            .leaflet-popup-content button:hover {
              background: #45a049 !important;
            }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            var map = L.map('map').setView([${initialLat}, ${initialLng}], 12);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors',
              maxZoom: 19
            }).addTo(map);

            // Add user marker
            ${userLocationMarker}

            // Add shop markers
            ${shopsMarkers}

            // Function for shop selection
            function selectShop(shopId) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'shopSelected',
                shopId: shopId
              }));
            }

            // React Native message handler
            window.addEventListener('message', function(event) {
              const data = JSON.parse(event.data);
              if (data.type === 'centerOnUser' && ${userLocation ? 'true' : 'false'}) {
                map.setView([${userLocation?.latitude || 0}, ${userLocation?.longitude || 0}], 15);
              } else if (data.type === 'centerOnShops' && ${shops.length > 0}) {
                const bounds = L.latLngBounds([${shopsBounds}]);
                map.fitBounds(bounds, { padding: [20, 20] });
              }
            });
          </script>
        </body>
      </html>
    `;
  };

  // Обработчик сообщений от WebView
  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'shopSelected') {
        const shop = shops.find(s => s.id.toString() === data.shopId);
        if (shop) {
          setSelectedShop(shop);
          setModalVisible(true);
        }
      }
    } catch (error) {
      console.error('WebView mesajını emal etmə xətası:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Xəritə yüklənir...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🗺️ Mağaza Xəritəsi</Text>
        <TouchableOpacity 
          style={styles.cartButton}
          onPress={() => navigation.navigate('Cart')}
        >
          <Text style={styles.cartButtonText}>🛒</Text>
          {/* {cartItems.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>
                {cartItems.reduce((total, item) => total + item.quantity, 0)}
              </Text>
            </View>
          )} */}
        </TouchableOpacity>
      </View>

      <WebView
        source={{ html: createMapHTML() }}
        style={styles.map}
        onMessage={handleWebViewMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.webViewLoading}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.webViewLoadingText}>Xəritə yüklənir...</Text>
          </View>
        )}
      />

      {/* Кнопки управления */}
      <View style={styles.controls}>
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={() => {
            if (userLocation) {
              // Отправляем сообщение в WebView для центрирования на пользователе
              const message = JSON.stringify({ type: 'centerOnUser' });
              // WebView автоматически обработает это сообщение
            }
          }}
        >
          <Text style={styles.controlButtonText}>📍 Mənim Məkanım</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={() => {
            if (shops.length > 0) {
              // Отправляем сообщение в WebView для центрирования на всех магазинах
              const message = JSON.stringify({ type: 'centerOnShops' });
              // WebView автоматически обработает это сообщение
            }
          }}
        >
          <Text style={styles.controlButtonText}>🏪 Bütün Mağazalar</Text>
        </TouchableOpacity>
      </View>

      {/* Модальное окно с деталями магазина */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedShop && (
              <>
                {selectedShop.picture && (
                  <Image 
                    source={{ uri: `${API_CONFIG.BASE_URL}/media/${selectedShop.picture}` }} 
                    style={styles.modalImage}
                    resizeMode="cover"
                    onError={(error) => console.log('Modal şəkil xətası:', error)}
                  />
                )}
                <Text style={styles.modalTitle}>{selectedShop.name}</Text>
                <Text style={styles.modalDescription}>
                  {selectedShop.description}
                </Text>
                <Text style={styles.modalCategory}>
                  {getCategoryIcon(selectedShop.category?.name)} {selectedShop.category?.name || 'Mağaza'}
                </Text>
                <Text style={styles.modalAddress}>
                  📍 {selectedShop.address}
                </Text>
                
                <View style={styles.modalInfo}>
                  <Text style={styles.modalInfoTitle}>📍 Koordinatlar:</Text>
                  <Text style={styles.modalInfoText}>
                    {parseFloat(selectedShop.location.latitude).toFixed(4)}, {parseFloat(selectedShop.location.longitude).toFixed(4)}
                  </Text>
                </View>
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => handleShopPress(selectedShop)}
                  >
                    <Text style={styles.modalButtonText}>👀 Məhsulaları baxın</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.closeButtonText}>Bağla</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    paddingTop: 40,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  map: {
    flex: 1,
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  webViewLoadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  controlButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  controlButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    margin: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalCategory: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  modalAddress: {
    fontSize: 12,
    color: '#888',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalInfo: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  modalInfoTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 3,
  },
  modalInfoText: {
    fontSize: 12,
    color: '#888',
  },
  modalButtons: {
    flexDirection: 'column',
    gap: 10,
  },
  modalButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#f44336',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartButtonText: {
    fontSize: 24,
    color: 'white',
  },
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'white',
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default MapScreen;
