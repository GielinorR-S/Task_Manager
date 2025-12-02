from rest_framework import serializers
from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.id')
    
    class Meta:
        model = Task
        fields = ['id', 'user', 'title', 'description', 'completed', 'due_at', 'created_at', 'updated_at']
        read_only_fields = ['user', 'created_at', 'updated_at']
