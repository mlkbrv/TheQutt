import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { API_CONFIG, getAuthHeaders } from '../config/api';

const ShopOwnerScreen = ({ navigation }) => {
  const { token } = useAuth();
  const [myShops, setMyShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [shopProducts, setShopProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    category: '',
    picture: null
  });
  const [imageUri, setImageUri] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadMyShops();
  }, []);

  const loadMyShops = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}/products/my-shops/`,
        { headers: getAuthHeaders(token) }
      );
      console.log('🏪 Mənim mağazalarım:', response.data);
      setMyShops(response.data);
    } catch (error) {
      console.error('❌ Mağazaları yükləmə xətası:', error);
      if (error.response?.status === 403) {
        Alert.alert('Giriş qadağandır', 'Mağazaları görmək üçün hüququunuz yoxdur');
      } else {
        Alert.alert('Xəta', 'Mağazalar yüklənə bilmədi');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadShopProducts = async (shopId) => {
    try {
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}/products/shops/${shopId}/products/`,
        { headers: getAuthHeaders(token) }
      );
      setShopProducts(response.data);
    } catch (error) {
      console.error('❌ Məhsulları yükləmə xətası:', error);
      Alert.alert('Xəta', 'Mağaza məhsulları yüklənə bilmədi');
    }
  };

  const handleShopPress = (shop) => {
    setSelectedShop(shop);
    loadShopProducts(shop.id);
    setModalVisible(true);
  };

  const pickImage = async () => {
    try {
      // Запрашиваем разрешение на доступ к галерее
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İcazə verilmədi', 'Qalereyaya giriş üçün icazə lazımdır');
        return;
      }

      // Открываем галерею для выбора изображения
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setNewProduct({...newProduct, picture: result.assets[0].uri});
      }
    } catch (error) {
      console.error('❌ İmatin seçilmə xətası:', error);
      Alert.alert('Xəta', 'İmat seçə bilmədiniz');
    }
  };

  const takePhoto = async () => {
    try {
      // Запрашиваем разрешение на доступ к камере
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İcazə verilmədi', 'Kameraya giriş üçün icazə lazımdır');
        return;
      }

      // Открываем камеру для съемки
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setNewProduct({...newProduct, picture: result.assets[0].uri});
      }
    } catch (error) {
      console.error('❌ Fotoçekmə xətası:', error);
      Alert.alert('Xəta', 'Fotoçekmə edə bilmədiniz');
    }
  };

  const uploadImage = async (imageUri) => {
    try {
      setUploadingImage(true);
      
      // Создаем FormData для загрузки файла
      const formData = new FormData();
      const imageName = imageUri.split('/').pop();
      const imageType = 'image/jpeg';
      
      formData.append('picture', {
        uri: imageUri,
        name: imageName,
        type: imageType,
      });

      // Загружаем изображение на сервер
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/products/upload-image/`,
        formData,
        { 
          headers: {
            ...getAuthHeaders(token),
            'Content-Type': 'multipart/form-data',
          }
        }
      );

      console.log('✅ Şəkil yükləndi:', response.data);
      return response.data.picture_path;
    } catch (error) {
      console.error('❌ Şəkil yüklənmə xətası:', error);
      throw new Error('Şəkil yüklənmədi');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.quantity) {
      Alert.alert('Xəta', 'Bütün tələb olunan sahələri doldurun');
      return;
    }

    try {
      let picturePath = null;
      
      // Если выбрано изображение, загружаем его
      if (imageUri) {
        try {
          picturePath = await uploadImage(imageUri);
        } catch (error) {
          Alert.alert('Xəta', 'Şəkil yüklənmədə xəta baş verdi. Yenidən cəhd edin.');
          return;
        }
      }

      const productData = {
        name: newProduct.name,
        description: newProduct.description || '',
        price: parseFloat(newProduct.price),
        quantity: parseInt(newProduct.quantity),
        category: newProduct.category || 'other',
        shop: selectedShop.id,
        picture: picturePath
      };

      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/products/products/`,
        productData,
        { headers: getAuthHeaders(token) }
      );

      console.log('✅ Məhsul əlavə edildi:', response.data);
      Alert.alert('Uğurlu', 'Məhsul uğurla əlavə edildi');
      
      // Обновляем список продуктов
      loadShopProducts(selectedShop.id);
      
      // Очищаем форму
      setNewProduct({
        name: '',
        description: '',
        price: '',
        quantity: '',
        category: '',
        picture: null
      });
      setImageUri(null);
      
      setProductModalVisible(false);
    } catch (error) {
      console.error('❌ Məhsul əlavə etmə xətası:', error);
      Alert.alert('Xəta', 'Məhsul əlavə edilmədi');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMyShops();
    setRefreshing(false);
  };

  const renderShop = ({ item }) => (
    <TouchableOpacity 
      style={styles.shopCard}
      onPress={() => handleShopPress(item)}
    >
      <View style={styles.shopHeader}>
        <Text style={styles.shopName}>🏪 {item.name}</Text>
        <Text style={styles.shopCategory}>📂 {item.category}</Text>
      </View>
      
      <Text style={styles.shopDescription} numberOfLines={2}>
        {item.description}
      </Text>
      
      <View style={styles.shopFooter}>
        <Text style={styles.shopAddress}>📍 {item.address}</Text>
        <Text style={styles.shopStatus}>
          {item.is_active ? '🟢 Aktiv' : '🔴 Aktiv deyil'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderProduct = ({ item }) => (
    <View style={styles.productCard}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.productDetails}>
          <Text style={styles.productPrice}>💰 {item.price} ₼</Text>
          <Text style={styles.productQuantity}>📦 {item.quantity} əd.</Text>
          <Text style={styles.productCategory}>🏷️ {item.category}</Text>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Mağazalarınızı yükləyirəm... 🏪</Text>
      </SafeAreaView>
    );
  }

  if (myShops.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🏪 Mağaza idarəetmə</Text>
        </View>
        
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🏪</Text>
          <Text style={styles.emptyTitle}>Sizin mağazalarınız yoxdur</Text>
          <Text style={styles.emptyText}>
            İlk mağazanızı yaradın, məhsulları satın alın!
          </Text>
          <TouchableOpacity
            style={styles.createShopButton}
            onPress={() => navigation.navigate('CreateShop')}
          >
            <Text style={styles.createShopButtonText}>➕ Mağaza yaradın</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏪 Mağaza idarəetmə</Text>
        <Text style={styles.headerSubtitle}>
          {myShops.length} mağaza(lar) sizin idarə etdiyiniz
        </Text>
      </View>

      <FlatList
        data={myShops}
        renderItem={renderShop}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.shopsList}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#4CAF50']}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Модальное окно с информацией о магазине */}
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
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>🏪 {selectedShop.name}</Text>
                  <TouchableOpacity
                    style={styles.closeModalButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.closeModalButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalDescription}>
                  {selectedShop.description}
                </Text>

                <View style={styles.modalInfo}>
                  <Text style={styles.modalInfoText}>📍 Ünvan: {selectedShop.address}</Text>
                  <Text style={styles.modalInfoText}>📂 Kateqoriya: {selectedShop.category}</Text>
                  <Text style={styles.modalInfoText}>🕒 İş vaxtları: {selectedShop.opening_hours || 'Təyin edilməyib'}</Text>
                </View>

                <View style={styles.productsSection}>
                  <View style={styles.productsHeader}>
                    <Text style={styles.productsTitle}>📦 Mağaza məhsulları</Text>
                    <TouchableOpacity
                      style={styles.addProductButton}
                      onPress={() => setProductModalVisible(true)}
                    >
                      <Text style={styles.addProductButtonText}>➕ Əlavə et</Text>
                    </TouchableOpacity>
                  </View>

                  {shopProducts.length > 0 ? (
                    <FlatList
                      data={shopProducts}
                      renderItem={renderProduct}
                      keyExtractor={(item) => item.id.toString()}
                      showsVerticalScrollIndicator={false}
                      style={styles.productsList}
                    />
                  ) : (
                    <Text style={styles.noProductsText}>
                      Mağazada məhsul yoxdur
                    </Text>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Модальное окно добавления продукта */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={productModalVisible}
        onRequestClose={() => setProductModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>➕ Məhsul əlavə et</Text>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setProductModalVisible(false)}
              >
                <Text style={styles.closeModalButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.productForm}>
              <Text style={styles.formLabel}>Məhsulun adı *</Text>
              <TextInput
                style={styles.formInput}
                value={newProduct.name}
                onChangeText={(text) => setNewProduct({...newProduct, name: text})}
                placeholder="Məhsulun adını daxil edin"
              />

              <Text style={styles.formLabel}>Təsvir</Text>
              <TextInput
                style={styles.formInput}
                value={newProduct.description}
                onChangeText={(text) => setNewProduct({...newProduct, description: text})}
                placeholder="Məhsulun təsviri"
                multiline
                numberOfLines={3}
              />

              <Text style={styles.formLabel}>Qiymət (₼) *</Text>
              <TextInput
                style={styles.formInput}
                value={newProduct.price}
                onChangeText={(text) => setNewProduct({...newProduct, price: text})}
                placeholder="0.00"
                keyboardType="numeric"
              />

              <Text style={styles.formLabel}>Miqdar *</Text>
              <TextInput
                style={styles.formInput}
                value={newProduct.quantity}
                onChangeText={(text) => setNewProduct({...newProduct, quantity: text})}
                placeholder="0"
                keyboardType="numeric"
              />

              <Text style={styles.formLabel}>Kateqoriya</Text>
              <TextInput
                style={styles.formInput}
                value={newProduct.category}
                onChangeText={(text) => setNewProduct({...newProduct, category: text})}
                placeholder="Məsələn: pizza, içki"
              />

              <Text style={styles.formLabel}>Məhsulun şəkli</Text>
              
              {/* Превью выбранного изображения */}
              {imageUri && (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => {
                      setImageUri(null);
                      setNewProduct({...newProduct, picture: null});
                    }}
                  >
                    <Text style={styles.removeImageButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Кнопки выбора изображения */}
              <View style={styles.imageButtonsContainer}>
                <TouchableOpacity
                  style={styles.imageButton}
                  onPress={pickImage}
                >
                  <Text style={styles.imageButtonText}>📁 Qalereyadan seçin</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.imageButton}
                  onPress={takePhoto}
                >
                  <Text style={styles.imageButtonText}>�� Kamera ilə çəkin</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, uploadingImage && styles.submitButtonDisabled]}
                onPress={handleAddProduct}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <View style={styles.loadingButton}>
                    <ActivityIndicator size="small" color="white" />
                    <Text style={styles.submitButtonText}>Şəkil yüklənir...</Text>
                  </View>
                ) : (
                  <Text style={styles.submitButtonText}>✅ Məhsul əlavə et</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    paddingTop: 50,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  shopsList: {
    padding: 20,
  },
  shopCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  shopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  shopName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  shopCategory: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  shopDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  shopFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shopAddress: {
    fontSize: 14,
    color: '#2E7D32',
    flex: 1,
  },
  shopStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  createShopButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  createShopButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    width: '90%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeModalButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f44336',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  modalInfo: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  modalInfoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  productsSection: {
    marginTop: 20,
  },
  productsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  productsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addProductButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addProductButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  productsList: {
    maxHeight: 300,
  },
  noProductsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  productCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  productQuantity: {
    fontSize: 14,
    color: '#666',
  },
  productCategory: {
    fontSize: 14,
    color: '#666',
  },
  productForm: {
    maxHeight: 400,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  loadingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  imagePreviewContainer: {
    position: 'relative',
    width: '100%',
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageButtonText: {
    color: 'red',
    fontSize: 20,
    fontWeight: 'bold',
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  imageButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  imageButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default ShopOwnerScreen;
