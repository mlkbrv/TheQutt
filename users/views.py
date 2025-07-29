from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import CustomUser
from .serializers import UserRegisterSerializer, UserProfileSerializer


class UserRegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response({
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
            },
            "message": "User registered successfully"
        }, status=status.HTTP_201_CREATED)


class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            user = serializer.user

            response.data['user'] = {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_staff': user.is_staff,
                'date_joined': user.date_joined.isoformat(),
                'profile_picture': user.profile_picture.url if user.profile_picture else None,
            }

        return response


class ProfileView(generics.RetrieveUpdateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.AllowAny]  # Разрешаем доступ всем

    def get_object(self):
        if self.request.user.is_authenticated:
            return self.request.user
        else:
            # Возвращаем дефолтный объект для неаутентифицированных пользователей
            return None

    def retrieve(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response({
                "message": "Authentication required to view profile",
                "user": {
                    "id": None,
                    "email": "user@example.com",
                    "first_name": "User",
                    "last_name": "",
                    "profile_picture": None
                }
            }, status=status.HTTP_401_UNAUTHORIZED)
        return super().retrieve(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response({
                "message": "Authentication required to update profile"
            }, status=status.HTTP_401_UNAUTHORIZED)
        return super().update(request, *args, **kwargs)