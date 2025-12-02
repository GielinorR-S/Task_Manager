"""
Authentication views for user registration and password reset
"""
from django.contrib.auth.models import User
from django.utils import timezone
from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
import secrets
import hashlib
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

# In-memory store for reset tokens (in production, use Redis or database)
# Format: {token_hash: {'user_id': int, 'expires_at': datetime, 'used': bool}}
RESET_TOKENS = {}


def generate_reset_token():
    """Generate a secure random token"""
    return secrets.token_urlsafe(32)


def hash_token(token):
    """Hash token for storage"""
    return hashlib.sha256(token.encode()).hexdigest()


def cleanup_expired_tokens():
    """Remove expired tokens from memory"""
    now = timezone.now()
    expired = [k for k, v in RESET_TOKENS.items() if v['expires_at'] < now or v['used']]
    for key in expired:
        RESET_TOKENS.pop(key, None)


@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    """
    User registration endpoint
    """
    username = request.data.get('username', '').strip()
    email = request.data.get('email', '').strip()
    password = request.data.get('password', '')
    password_confirm = request.data.get('password_confirm', '')

    # Validation
    errors = {}
    
    if not username:
        errors['username'] = 'Username is required'
    elif len(username) < 3:
        errors['username'] = 'Username must be at least 3 characters'
    elif User.objects.filter(username=username).exists():
        errors['username'] = 'Username already exists'
    
    if not email:
        errors['email'] = 'Email is required'
    elif not '@' in email or '.' not in email.split('@')[1]:
        errors['email'] = 'Invalid email format'
    elif User.objects.filter(email=email).exists():
        errors['email'] = 'Email already registered'
    
    if not password:
        errors['password'] = 'Password is required'
    elif len(password) < 8:
        errors['password'] = 'Password must be at least 8 characters'
    
    if password != password_confirm:
        errors['password_confirm'] = 'Passwords do not match'
    
    if errors:
        return Response({'errors': errors}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password
            )
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'message': 'User created successfully',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                },
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                }
            }, status=status.HTTP_201_CREATED)
    except Exception as e:
        logger.error(f"Signup error: {e}")
        return Response(
            {'error': 'Failed to create user. Please try again.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset(request):
    """
    Request password reset - sends reset token
    """
    email = request.data.get('email', '').strip()
    
    if not email:
        return Response(
            {'error': 'Email is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # Don't reveal if email exists (security best practice)
        return Response({
            'message': 'If an account with that email exists, a password reset link has been sent.'
        }, status=status.HTTP_200_OK)
    
    # Generate reset token
    token = generate_reset_token()
    token_hash = hash_token(token)
    expires_at = timezone.now() + timedelta(minutes=15)
    
    # Store token
    RESET_TOKENS[token_hash] = {
        'user_id': user.id,
        'expires_at': expires_at,
        'used': False,
    }
    
    # Cleanup old tokens
    cleanup_expired_tokens()
    
    # In production, send email here
    # For now, we'll return the token in development (remove in production!)
    reset_url = f"{request.scheme}://{request.get_host()}/reset-password?token={token}"
    
    logger.info(f"Password reset requested for {email}. Token: {token} (DEV ONLY - remove in production)")
    
    # In production, use email service:
    # send_password_reset_email(user.email, reset_url)
    
    # In development, return token for testing
    from django.conf import settings
    response_data = {
        'message': 'If an account with that email exists, a password reset link has been sent.',
    }
    if settings.DEBUG:
        response_data['reset_token'] = token
        response_data['reset_url'] = reset_url
    
    return Response(response_data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """
    Reset password using token
    """
    token = request.data.get('token', '').strip()
    new_password = request.data.get('password', '')
    password_confirm = request.data.get('password_confirm', '')
    
    errors = {}
    
    if not token:
        errors['token'] = 'Reset token is required'
    
    if not new_password:
        errors['password'] = 'Password is required'
    elif len(new_password) < 8:
        errors['password'] = 'Password must be at least 8 characters'
    
    if new_password != password_confirm:
        errors['password_confirm'] = 'Passwords do not match'
    
    if errors:
        return Response({'errors': errors}, status=status.HTTP_400_BAD_REQUEST)
    
    # Find token
    token_hash = hash_token(token)
    token_data = RESET_TOKENS.get(token_hash)
    
    if not token_data:
        return Response(
            {'error': 'Invalid or expired reset token'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if token_data['used']:
        return Response(
            {'error': 'This reset token has already been used'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if token_data['expires_at'] < timezone.now():
        RESET_TOKENS.pop(token_hash, None)
        return Response(
            {'error': 'Reset token has expired. Please request a new one.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(id=token_data['user_id'])
        user.set_password(new_password)
        user.save()
        
        # Mark token as used
        token_data['used'] = True
        
        return Response({
            'message': 'Password reset successfully. You can now login with your new password.'
        }, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Password reset error: {e}")
        return Response(
            {'error': 'Failed to reset password. Please try again.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

