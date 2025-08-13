import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { API_CONFIG } from '../config/api';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || 
        !formData.confirmPassword || !formData.firstName || !formData.lastName) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все поля');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Ошибка', 'Пароли не совпадают');
      return false;
    }

    if (formData.password.length < 8) {
      Alert.alert('Ошибка', 'Пароль должен содержать минимум 8 символов');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await axios.post(API_CONFIG.REGISTER_URL, {
        email: formData.email,
        password: formData.password,
        password2: formData.confirmPassword,
        first_name: formData.firstName,
        last_name: formData.lastName
      });

      Alert.alert(
        'Успех! 🎉',
        'Аккаунт успешно создан! Теперь вы можете войти в систему.',
        [
          {
            text: 'Отлично!',
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
    } catch (error) {
      console.error('Registration error:', error);
      let errorMessage = 'Произошла ошибка при регистрации';
      
      if (error.response?.data) {
        if (error.response.data.email) {
          errorMessage = `Email: ${error.response.data.email[0]}`;
        } else if (error.response.data.password) {
          errorMessage = `Пароль: ${error.response.data.password[0]}`;
        } else if (error.response.data.password2) {
          errorMessage = `Подтверждение пароля: ${error.response.data.password2[0]}`;
        } else if (error.response.data.first_name) {
          errorMessage = `Имя: ${error.response.data.first_name[0]}`;
        } else if (error.response.data.last_name) {
          errorMessage = `Фамилия: ${error.response.data.last_name[0]}`;
        }
      }
      
      Alert.alert('Ошибка регистрации', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>← Назад</Text>
            </TouchableOpacity>
            <Text style={styles.logo}>🍽️ Qutt</Text>
            <Text style={styles.tagline}>Создайте свой аккаунт! ✨</Text>
          </View>

          {/* Registration Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputRow}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.inputLabel}>👤 Имя</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ваше имя"
                  placeholderTextColor="#9E9E9E"
                  value={formData.firstName}
                  onChangeText={(value) => handleInputChange('firstName', value)}
                />
              </View>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.inputLabel}>👤 Фамилия</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ваша фамилия"
                  placeholderTextColor="#9E9E9E"
                  value={formData.lastName}
                  onChangeText={(value) => handleInputChange('lastName', value)}
                />
              </View>
            </View>



            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>📧 Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Введите ваш email"
                placeholderTextColor="#9E9E9E"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>🔒 Пароль</Text>
              <TextInput
                style={styles.input}
                placeholder="Придумайте пароль (мин. 8 символов)"
                placeholderTextColor="#9E9E9E"
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                secureTextEntry
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>🔐 Подтвердите пароль</Text>
              <TextInput
                style={styles.input}
                placeholder="Повторите пароль"
                placeholderTextColor="#9E9E9E"
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              <Text style={styles.registerButtonText}>
                {isLoading ? 'Создание... 🔄' : 'Создать аккаунт 🚀'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Уже есть аккаунт?</Text>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginButtonText}>Войти ✨</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 10,
  },
  backButtonText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '600',
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 10,
  },
  tagline: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  halfWidth: {
    width: '48%',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    color: '#333',
  },
  registerButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
  },
  registerButtonDisabled: {
    backgroundColor: '#9E9E9E',
  },
  registerButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
    fontSize: 16,
    marginBottom: 15,
  },
  loginButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 30,
    paddingVertical: 15,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
