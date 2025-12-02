# Generated migration for adding user field to Task model
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def assign_tasks_to_first_user(apps, schema_editor):
    """Assign existing tasks to the first user, or delete them if no users exist"""
    Task = apps.get_model('tasks', 'Task')
    User = apps.get_model(settings.AUTH_USER_MODEL)
    
    # Get first user or create a default one
    user = User.objects.first()
    if not user:
        # If no users exist, delete all tasks
        Task.objects.all().delete()
        return
    
    # Assign all existing tasks to the first user
    Task.objects.filter(user__isnull=True).update(user=user)


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('tasks', '0002_task_due_at'),
    ]

    operations = [
        migrations.AddField(
            model_name='task',
            name='user',
            field=models.ForeignKey(
                null=True,  # Allow null initially
                on_delete=django.db.models.deletion.CASCADE,
                related_name='tasks',
                to=settings.AUTH_USER_MODEL
            ),
        ),
        migrations.RunPython(assign_tasks_to_first_user, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='task',
            name='user',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='tasks',
                to=settings.AUTH_USER_MODEL
            ),
        ),
    ]

