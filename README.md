# TheQutt 🍽️

A comprehensive food ordering platform with discounts, similar to Too Good To Go. The project consists of a Django REST API backend and a React Native mobile application.

## 🌟 Features

- **Food Ordering System**: Order food with significant discounts from local restaurants and cafes
- **Real-time Map Integration**: Find nearby restaurants with interactive map functionality
- **User Authentication**: Secure JWT-based authentication system
- **Order Management**: Complete order lifecycle management
- **Mobile-First Design**: Native mobile experience with React Native
- **RESTful API**: Robust Django REST framework backend

## 🏗️ Project Structure

```
TheQutt/
├── TheQutt/              # Django project settings
├── products/             # Product management app
├── users/                # User authentication & management
├── orders/               # Order processing app
├── map/                  # Map & location services
├── MobileApp/            # React Native mobile application
├── staticfiles/          # Static files
├── media/                # Media uploads
└── requirements.txt      # Python dependencies
```

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL (optional, SQLite by default)
- Virtual environment

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TheQutt
   ```

2. **Create and activate virtual environment**
   ```bash
   python -m venv .venv
   # On Windows
   .venv\Scripts\activate
   # On macOS/Linux
   source .venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run migrations**
   ```bash
   python manage.py migrate
   ```

5. **Create superuser (optional)**
   ```bash
   python manage.py createsuperuser
   ```

6. **Start development server**
   ```bash
   python manage.py runserver
   ```

The Django backend will be available at `http://localhost:8000`

### Mobile App Setup

1. **Navigate to MobileApp directory**
   ```bash
   cd MobileApp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API endpoint**
   Edit `api/api.js` and update the `baseURL` to point to your Django server:
   ```javascript
   baseURL: 'http://localhost:8000'
   ```

4. **Start the mobile app**
   ```bash
   npm start
   ```

## 🔧 Configuration

### Django Settings

Key configuration options in `TheQutt/settings.py`:

- **Database**: SQLite by default, can be configured for PostgreSQL
- **CORS**: Configured for cross-origin requests
- **JWT**: JWT authentication enabled
- **Media**: File uploads configured

### Environment Variables

Create a `.env` file in the root directory:

```env
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
```

## 📱 Mobile App Features

### Authentication
- User registration and login
- JWT token management
- Secure password handling

### Main Features
- **Home Screen**: Browse restaurants by category
- **Map View**: Interactive map with restaurant locations
- **Shopping Cart**: Add/remove items, quantity management
- **Order History**: Track order status and history
- **User Profile**: Account management and settings

### Navigation
- Tab-based navigation
- Authentication flow
- Screen transitions

## 🗄️ Database Models

### Users App
- Custom user model with extended fields
- Profile information management

### Products App
- Product categories and items
- Restaurant/store information
- Pricing and discount management

### Orders App
- Order creation and management
- Order status tracking
- Payment integration ready

### Map App
- Location services
- Geographic data management

## 🔌 API Endpoints

### Authentication
- `POST /api/users/register/` - User registration
- `POST /api/users/login/` - User login
- `POST /api/users/logout/` - User logout

### Products
- `GET /api/products/` - List all products
- `GET /api/products/{id}/` - Get product details
- `GET /api/products/categories/` - List categories

### Orders
- `GET /api/orders/` - User's order history
- `POST /api/orders/` - Create new order
- `GET /api/orders/{id}/` - Order details

### Map
- `GET /api/map/locations/` - Get map locations
- `GET /api/map/nearby/` - Find nearby restaurants

## 🛠️ Development

### Running Tests
```bash
python manage.py test
```

### Code Quality
- Follow Django coding style guidelines
- Use Django REST framework best practices
- Implement proper error handling

### Database Management
```bash
# Create new migration
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Reset database (development only)
python manage.py flush
```

## 📦 Dependencies

### Backend (Python)
- Django 5.2.4
- Django REST Framework 3.16.0
- Django CORS Headers 4.7.0
- JWT Authentication
- Pillow (image processing)
- PostgreSQL support

### Mobile App (JavaScript/React Native)
- React Native with Expo
- Navigation libraries
- State management
- HTTP client (Axios)
- Map integration

## 🚀 Deployment

### Backend Deployment
1. Set `DEBUG = False` in production
2. Configure production database
3. Set up static file serving
4. Configure CORS for production domains
5. Use environment variables for sensitive data

### Mobile App Deployment
1. Build production APK/IPA
2. Configure production API endpoints
3. Test on real devices
4. Submit to app stores

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔮 Future Enhancements

- Push notifications
- Payment gateway integration
- Restaurant dashboard
- Analytics and reporting
- Multi-language support
- Advanced filtering and search

---

**TheQutt** - Making food ordering sustainable and affordable! 🎯
