from django.db.models import F, Q
from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from .models import Task
from .serializers import TaskSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from datetime import datetime
import re

try:
    from .ai_service import ai_service
    AI_AVAILABLE = True
except (ImportError, Exception) as e:
    # Gracefully handle any import or initialization errors
    # Don't use logging here as it might not be configured yet
    import sys
    print(f"Warning: AI service not available: {e}", file=sys.stderr)
    AI_AVAILABLE = False
    ai_service = None


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'category']
    ordering_fields = ['created_at', 'updated_at', 'due_at', 'priority', 'title']
    ordering = ['completed', F('due_at').asc(nulls_last=True), '-created_at']
    
    def get_queryset(self):
        # Only show tasks belonging to the authenticated user
        queryset = Task.objects.filter(user=self.request.user)
        
        # Filter by completion status
        status = self.request.query_params.get('status', None)
        if status == 'active':
            queryset = queryset.filter(completed=False)
        elif status == 'completed':
            queryset = queryset.filter(completed=True)
        
        # Filter by category
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category=category)
        
        # Filter by priority
        priority = self.request.query_params.get('priority', None)
        if priority:
            queryset = queryset.filter(priority=priority)
        
        # Search
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(description__icontains=search) |
                Q(category__icontains=search)
            )
        
        # Ordering
        order_by = self.request.query_params.get('ordering', None)
        if order_by:
            queryset = queryset.order_by(order_by)
        else:
            queryset = queryset.order_by('completed', F('due_at').asc(nulls_last=True), '-created_at')
        
        return queryset
    
    def perform_create(self, serializer):
        # Automatically assign task to current user
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get dashboard statistics"""
        from django.utils import timezone
        # Only count user's tasks
        user_tasks = Task.objects.filter(user=request.user)
        total = user_tasks.count()
        completed = user_tasks.filter(completed=True).count()
        active = user_tasks.filter(completed=False).count()
        overdue = user_tasks.filter(completed=False, due_at__lt=timezone.now()).count()
        
        # Stats by category (if category field exists)
        category_stats = {}
        if hasattr(Task, 'CATEGORY_CHOICES'):
            for category_code, category_name in Task.CATEGORY_CHOICES:
                category_stats[category_code] = {
                    'name': category_name,
                    'total': user_tasks.filter(category=category_code).count(),
                    'active': user_tasks.filter(category=category_code, completed=False).count(),
                }
        
        # Stats by priority (if priority field exists)
        priority_stats = {}
        if hasattr(Task, 'PRIORITY_CHOICES'):
            for priority_code, priority_name in Task.PRIORITY_CHOICES:
                priority_stats[priority_code] = {
                    'name': priority_name,
                    'total': user_tasks.filter(priority=priority_code).count(),
                    'active': user_tasks.filter(priority=priority_code, completed=False).count(),
                }
        
        return Response({
            'total': total,
            'completed': completed,
            'active': active,
            'overdue': overdue,
            'categories': category_stats,
            'priorities': priority_stats,
        })


class AssistantCommandView(APIView):
    permission_classes = [IsAuthenticated]

    def _parse_datetime(self, date_str: str) -> datetime:
        """Parse various datetime formats from user input."""
        if not date_str:
            return None
        
        date_str = date_str.strip()
        
        # Try common ISO and standard formats first
        formats = [
            '%Y-%m-%d %H:%M:%S',
            '%Y-%m-%dT%H:%M:%S',
            '%Y-%m-%d %H:%M',
            '%Y-%m-%d',
            '%m/%d/%Y %H:%M',
            '%m/%d/%Y',
            '%Y-%m-%dT%H:%M',
        ]
        
        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
        
        # If all formats fail, try to parse as ISO format with timezone handling
        # Note: python-dateutil is optional, so we handle ImportError gracefully
        try:
            from dateutil import parser
            return parser.parse(date_str)
        except ImportError:
            # dateutil not installed, skip this parsing method
            pass
        except (ValueError, Exception):
            # dateutil is installed but couldn't parse, skip
            pass
        
        return None

    def _execute_action(self, action: dict, user) -> str:
        """Execute an action from AI response."""
        action_type = action.get('action', '').lower()
        
        if action_type == 'create':
            title = action.get('title', '').strip()
            if not title:
                return "I need a title to create a task. What should I call it?"
            
            description = action.get('description', '').strip() or "Created via assistant"
            due_at_str = action.get('due_at', '').strip()
            due_at = None
            
            if due_at_str:
                due_at = self._parse_datetime(due_at_str)
                # If parsing failed, log it but continue without due date
                if not due_at:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.warning(f"Could not parse due date: {due_at_str}")
            
            category = action.get('category', 'other').strip()
            if category not in [c[0] for c in Task.CATEGORY_CHOICES]:
                category = 'other'
            
            priority = action.get('priority', 'medium').strip()
            if priority not in [p[0] for p in Task.PRIORITY_CHOICES]:
                priority = 'medium'
            
            try:
                task = Task.objects.create(
                    user=user,
                    title=title[:200],
                    description=description,
                    completed=False,
                    due_at=due_at,
                    category=category,
                    priority=priority,
                )
                due_info = f" (due {due_at_str})" if due_at else ""
                return f'Got it! I created task #{task.id}: "{task.title}"{due_info}.'
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error creating task: {e}", exc_info=True)
                return f"Sorry, I couldn't create the task. Error: {str(e)}"
        
        elif action_type == 'update':
            task_id = action.get('task_id')
            if not task_id:
                # List available tasks
                tasks = list(Task.objects.filter(completed=False).order_by("-created_at")[:5])
                if tasks:
                    task_list = ", ".join(f"#{t.id}: {t.title}" for t in tasks)
                    return f"I need a task ID to update. Here are your available tasks: {task_list}"
                return "I need a task ID to update. You don't have any tasks yet."
            
            try:
                task = Task.objects.get(id=task_id)
                if 'title' in action:
                    task.title = action['title'][:200]
                if 'description' in action:
                    task.description = action['description']
                if 'due_at' in action:
                    task.due_at = self._parse_datetime(action['due_at'])
                if 'completed' in action:
                    task.completed = bool(action['completed'])
                if 'category' in action:
                    task.category = action['category']
                if 'priority' in action:
                    task.priority = action['priority']
                task.save()
                return f'Updated task #{task_id}: "{task.title}".'
            except Task.DoesNotExist:
                tasks = list(Task.objects.filter(completed=False).order_by("-created_at")[:5])
                if tasks:
                    task_list = ", ".join(f"#{t.id}: {t.title}" for t in tasks)
                    return f"I couldn't find a task with ID {task_id}. Here are your available tasks: {task_list}"
                return f"I couldn't find a task with ID {task_id}. You don't have any tasks yet."
        
        elif action_type == 'complete':
            task_id = action.get('task_id')
            if not task_id:
                tasks = list(Task.objects.filter(completed=False).order_by("-created_at")[:5])
                if tasks:
                    task_list = ", ".join(f"#{t.id}: {t.title}" for t in tasks)
                    return f"I need a task ID to complete. Here are your available tasks: {task_list}"
                return "I need a task ID to complete. You don't have any tasks yet."
            
            try:
                task = Task.objects.get(id=task_id)
                task.completed = True
                task.save(update_fields=["completed", "updated_at"])
                return f"Nice! ✅ I marked task #{task_id} '{task.title}' as completed."
            except Task.DoesNotExist:
                tasks = list(Task.objects.filter(completed=False).order_by("-created_at")[:5])
                if tasks:
                    task_list = ", ".join(f"#{t.id}: {t.title}" for t in tasks)
                    return f"I couldn't find a task with ID {task_id}. Here are your available tasks: {task_list}"
                return f"I couldn't find a task with ID {task_id}. You don't have any tasks yet."
        
        elif action_type == 'delete':
            task_id = action.get('task_id')
            if not task_id:
                tasks = list(Task.objects.filter(completed=False).order_by("-created_at")[:5])
                if tasks:
                    task_list = ", ".join(f"#{t.id}: {t.title}" for t in tasks)
                    return f"I need a task ID to delete. Here are your available tasks: {task_list}"
                return "I need a task ID to delete. You don't have any tasks yet."
            
            try:
                task = Task.objects.get(id=task_id)
                task_title = task.title
                task.delete()
                return f"Done! I've deleted task #{task_id}: '{task_title}'."
            except Task.DoesNotExist:
                tasks = list(Task.objects.filter(completed=False).order_by("-created_at")[:5])
                if tasks:
                    task_list = ", ".join(f"#{t.id}: {t.title}" for t in tasks)
                    return f"I couldn't find a task with ID {task_id}. Here are your available tasks: {task_list}"
                return f"I couldn't find a task with ID {task_id}. You don't have any tasks yet."
        
        return "I'm not sure what action to take. Could you clarify?"

    def _fallback_regex_handler(self, text: str, user) -> str:
        """Fallback regex-based handler when AI is not available."""
        lowered = text.lower().strip()
        
        # Get user's tasks for context
        all_tasks = list(Task.objects.filter(user=user).order_by("-created_at")[:10])
        active_tasks = [t for t in all_tasks if not t.completed]

        # Greetings and casual conversation
        if any(word in lowered for word in ["hi", "hello", "hey", "greetings"]):
            return "Hi there! 👋 I'm Aurora, your task assistant. How can I help you today?"
        
        if any(phrase in lowered for phrase in ["how are you", "how's it going", "how are things"]):
            return "I'm doing great, thanks for asking! Ready to help you manage your tasks. What would you like to do?"
        
        if any(word in lowered for word in ["thanks", "thank you", "appreciate"]):
            return "You're welcome! Happy to help. Anything else you need?"
        
        # Delete task: "delete task 3" or "remove task 1"
        m = re.search(r"(delete|remove)\s+task\s+(\d+)", lowered)
        if m:
            task_id = int(m.group(2))
            try:
                task = Task.objects.get(id=task_id, user=user)
                task_title = task.title
                task.delete()
                return f"Done! I've deleted task #{task_id}: '{task_title}'."
            except Task.DoesNotExist:
                # List available tasks
                if active_tasks:
                    task_list = ", ".join(f"#{t.id}: {t.title}" for t in active_tasks[:5])
                    return f"I couldn't find a task with ID {task_id}. Here are your available tasks: {task_list}"
                return f"I couldn't find a task with ID {task_id}. You don't have any tasks yet. Try creating one!"

        # Complete task: "complete task 2" or "mark task 1 as done"
        m = re.search(r"(complete|finish|done|mark.*?done)\s+task\s+(\d+)", lowered)
        if m:
            task_id = int(m.group(2))
            try:
                task = Task.objects.get(id=task_id, user=user)
                task.completed = True
                task.save(update_fields=["completed", "updated_at"])
                return f"Excellent! ✅ I marked task #{task_id} '{task.title}' as completed."
            except Task.DoesNotExist:
                if active_tasks:
                    task_list = ", ".join(f"#{t.id}: {t.title}" for t in active_tasks[:5])
                    return f"I couldn't find a task with ID {task_id}. Here are your available tasks: {task_list}"
                return f"I couldn't find a task with ID {task_id}. You don't have any tasks yet."

        # List tasks - multiple variations
        if any(phrase in lowered for phrase in ["show tasks", "list tasks", "what tasks", "my tasks", "tasks i have"]):
            if active_tasks:
                task_list = "\n".join(f"  • #{t.id}: {t.title}" for t in active_tasks[:10])
                return f"Here are your active tasks:\n{task_list}\n\nYou have {len(active_tasks)} active task(s) in total."
            return "You don't have any active tasks right now. Would you like to create one?"

        # Create task - improved pattern matching
        create_patterns = [
            r"add\s+task\s+(.+)",
            r"create\s+task\s+(.+)",
            r"new\s+task\s+(.+)",
            r"remind\s+me\s+to\s+(.+)",
            r"remember\s+to\s+(.+)",
            r"i\s+need\s+to\s+(.+)",
            r"task\s+to\s+(.+)",
        ]
        
        for pattern in create_patterns:
            m = re.search(pattern, lowered, re.IGNORECASE)
            if m:
                title = m.group(1).strip(" .:!?")
                if title and len(title) > 2:  # Make sure we have a real title
                    try:
                        task = Task.objects.create(
                            user=user,
                            title=title[:200],
                            description="Created via assistant",
                            completed=False,
                            due_at=None,
                        )
                        return f'Perfect! ✨ I created task #{task.id}: "{task.title}".'
                    except Exception as e:
                        return f"Sorry, I had trouble creating that task: {str(e)}"
        
        # If it starts with "add", "create", "new" but no task keyword, try to extract
        if lowered.startswith(("add ", "create ", "new ")) and "task" not in lowered:
            # Try to extract what comes after
            parts = lowered.split(None, 1)
            if len(parts) > 1:
                title = parts[1].strip(" .:!?")
                if title and len(title) > 2:
                    try:
                        task = Task.objects.create(
                            user=user,
                            title=title[:200],
                            description="Created via assistant",
                            completed=False,
                            due_at=None,
                        )
                        return f'Got it! I created task #{task.id}: "{task.title}".'
                    except Exception as e:
                        return f"Sorry, I had trouble creating that task: {str(e)}"

        # Fallback - be conversational and helpful
        if len(lowered) < 3:
            return "I didn't quite catch that. Could you say a bit more?"
        
        # If they're asking a question
        if "?" in text or any(word in lowered for word in ["what", "how", "when", "where", "why", "can you", "could you"]):
            return "I'm here to help with your tasks! You can ask me to create, complete, delete, or list tasks. Try saying something like 'add task call John' or 'show my tasks'."
        
        # Default friendly response
        return "I'm not sure what you'd like me to do. I can help you:\n• Create tasks (say 'add task [description]')\n• Complete tasks (say 'complete task [number]')\n• Delete tasks (say 'delete task [number]')\n• List tasks (say 'show tasks')\n\nOr just chat with me! 😊"

    def post(self, request, *args, **kwargs):
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            text = (request.data.get("message") or "").strip()
            logger.info(f"Assistant received message: {text[:50]}")
            
            if not text:
                return Response({"reply": "I didn't catch that. Try asking me to create or update a task."})

            # Get user's tasks for context - only current user's tasks
            try:
                user_tasks = list(Task.objects.filter(user=request.user).order_by('completed', F('due_at').asc(nulls_last=True), '-created_at'))
            except Exception as e:
                logger.warning(f"Error fetching user tasks: {e}")
                user_tasks = []
            
            # Try AI service first if available
            if AI_AVAILABLE and ai_service:
                try:
                    if ai_service.is_available():
                        logger.info("Using AI service")
                        result = ai_service.process_message(text, user_tasks)
                        reply = result.get("reply", "I've processed that request.")
                        action = result.get("action")
                        
                        if action:
                            logger.info(f"AI returned action: {action}")
                        else:
                            logger.debug(f"AI response (no action): {reply[:100]}")
                        
                        # Execute action if provided
                        if action and isinstance(action, dict):
                            try:
                                action_reply = self._execute_action(action, request.user)
                                # Combine AI reply with action confirmation
                                if action_reply:
                                    # If reply is just the default, replace it with action reply
                                    if reply == "I've processed that request.":
                                        reply = action_reply
                                    else:
                                        # Append action confirmation to conversational reply
                                        reply = f"{reply}\n\n{action_reply}"
                            except Exception as action_err:
                                logger.error(f"Action execution error: {action_err}", exc_info=True)
                                error_msg = f"Sorry, I had trouble with that action: {str(action_err)}"
                                if reply == "I've processed that request.":
                                    reply = error_msg
                                else:
                                    reply = f"{reply}\n\n{error_msg}"
                        
                        logger.info(f"Returning reply: {reply[:100]}")
                        return Response({"reply": reply})
                    else:
                        logger.info("AI service not available, using fallback")
                except Exception as e:
                    # Fall back to regex if AI fails
                    logger.error(f"AI service error: {e}", exc_info=True)
            else:
                logger.info("AI service not configured, using fallback")
            
            # Fallback to regex-based handler
            try:
                logger.info("Using fallback regex handler")
                reply = self._fallback_regex_handler(text, request.user)
                logger.info(f"Fallback returned: {reply[:100]}")
            except Exception as e:
                logger.error(f"Fallback handler error: {e}", exc_info=True)
                reply = "I encountered an error processing your request. Please try again."
            
            return Response({"reply": reply})
            
        except Exception as e:
            logger.error(f"Assistant endpoint error: {e}", exc_info=True)
            return Response(
                {"reply": f"I'm having trouble right now: {str(e)}. Please try again in a moment."},
                status=500
            )
