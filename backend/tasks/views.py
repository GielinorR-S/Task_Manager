from django.db.models import Case, IntegerField, Value, When
from rest_framework import viewsets, permissions
from .models import Task
from .serializers import TaskSerializer


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.annotate(
        due_is_null=Case(
            When(due_at=None, then=Value(1)),
            default=Value(0),
            output_field=IntegerField(),
        )
    ).order_by('completed', 'due_is_null', 'due_at', '-created_at')
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]
