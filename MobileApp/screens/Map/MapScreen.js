import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapMarkerCard from '../../components/MapMarkerCard';
import { mapAPI } from '../../api/api';

const MapScreen = ({ navigation }) => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState(null);
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const response = await mapAPI.getLocations();
      setLocations(response.data);
      
      // Если есть локации, центрируем карту на первой
      if (response.data.length > 0) {
        const firstLocation = response.data[0];
        setRegion({
          latitude: parseFloat(firstLocation.latitude),
          longitude: parseFloat(firstLocation.longitude),
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }
    } catch (error) {
      console.log('Error loading locations:', error);
      // Если ошибка 401 (Unauthorized), показываем пустой список
      if (error.response?.status === 401) {
        setLocations([]);
      } else if (error.code === 'ECONNABORTED' || !error.response) {
        setLocations([]);
      } else {
        Alert.alert('Error', 'Failed to load locations');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerPress = (shop) => {
    setSelectedShop(shop);
  };

  const handleViewProducts = (shop) => {
    setSelectedShop(null);
    // Навигация к экрану с товарами магазина
    // Здесь нужно будет добавить навигацию к экрану товаров
    Alert.alert('Shop Selected', `Viewing products from ${shop.name}`);
  };

  const renderMarker = (location) => (
    <Marker
      key={location?.id || Math.random()}
      coordinate={{
        latitude: parseFloat(location.latitude),
        longitude: parseFloat(location.longitude),
      }}
      onPress={() => handleMarkerPress(location)}
    >
      <View style={styles.markerContainer}>
        <View style={styles.marker}>
          <Text style={styles.markerEmoji}>🏪</Text>
        </View>
      </View>
    </Marker>
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
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
      >
        {locations.map(renderMarker)}
      </MapView>

      {selectedShop && (
        <View style={styles.cardContainer}>
          <MapMarkerCard
            shop={selectedShop}
            onViewProducts={handleViewProducts}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerEmoji: {
    fontSize: 20,
  },
  cardContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
});

export default MapScreen; 