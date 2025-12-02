"""
AI Service integration for the task assistant.
Supports OpenAI by default, but can be extended for other providers.
"""
import os
import json
from typing import Optional, Dict, Any

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    OpenAI = None


class AIService:
    """AI service wrapper for task management assistant."""
    
    def __init__(self):
        self.api_key = os.getenv('OPENAI_API_KEY', '')
        self.model = os.getenv('OPENAI_MODEL', 'gpt-4o-mini')
        self.client = None
        
        try:
            if OPENAI_AVAILABLE and self.api_key and OpenAI:
                self.client = OpenAI(api_key=self.api_key)
        except Exception as e:
            # Silently fail if OpenAI initialization fails
            self.client = None
    
    def is_available(self) -> bool:
        """Check if AI service is configured and available."""
        return OPENAI_AVAILABLE and bool(self.api_key) and self.client is not None
    
    def get_system_prompt(self, user_tasks: list) -> str:
        """Generate system prompt with task context."""
        from datetime import datetime
        
        now = datetime.now()
        tasks_context = ""
        overdue_tasks = []
        due_soon_tasks = []
        active_tasks = []
        completed_tasks = []
        
        if user_tasks:
            for task in user_tasks:
                status = "✓ Completed" if task.completed else "○ Active"
                due_info = ""
                is_overdue = False
                is_due_soon = False
                
                if task.due_at:
                    try:
                        # Handle Django datetime objects and ISO strings
                        if hasattr(task.due_at, 'isoformat'):
                            # Django datetime object
                            due_date = task.due_at
                            if hasattr(due_date, 'replace'):
                                # Make timezone-aware or naive for comparison
                                if due_date.tzinfo:
                                    from django.utils import timezone
                                    now_tz = timezone.now()
                                    time_diff = (due_date - now_tz).total_seconds()
                                else:
                                    time_diff = (due_date - now.replace(tzinfo=None)).total_seconds()
                            else:
                                time_diff = 0
                        else:
                            # String format - try to parse
                            due_str = str(task.due_at)
                            try:
                                due_date = datetime.fromisoformat(due_str.replace('Z', '+00:00'))
                            except:
                                try:
                                    due_date = datetime.fromisoformat(due_str.replace('Z', ''))
                                except:
                                    due_date = None
                            
                            if due_date:
                                if due_date.tzinfo:
                                    # Make naive for comparison with naive now
                                    due_date = due_date.replace(tzinfo=None)
                                time_diff = (due_date - now.replace(tzinfo=None)).total_seconds()
                            else:
                                time_diff = 0
                                due_date = None
                        
                        if due_date:
                            due_info = f" (Due: {due_date.strftime('%Y-%m-%d %H:%M')})"
                            if not task.completed:
                                if time_diff < 0:
                                    is_overdue = True
                                    overdue_tasks.append(task)
                                elif time_diff <= 86400:  # 24 hours
                                    is_due_soon = True
                                    due_soon_tasks.append(task)
                        else:
                            due_info = f" (Due: {task.due_at})"
                    except Exception:
                        due_info = f" (Due: {task.due_at})"
                
                task_line = f"  {task.id}. {status} - {task.title}{due_info}"
                if task.description:
                    task_line += f"\n     Description: {task.description[:100]}"
                
                if task.completed:
                    completed_tasks.append(task_line)
                else:
                    active_tasks.append(task_line)
            tasks_context = "\n".join(active_tasks[:20] + completed_tasks[:5])
        else:
            tasks_context = "  No tasks yet."
        
        overdue_summary = ""
        if overdue_tasks:
            overdue_summary = f"\n\n⚠️ OVERDUE TASKS ({len(overdue_tasks)}):\n" + "\n".join([f"  - Task #{t.id}: {t.title}" for t in overdue_tasks[:5]])
        
        due_soon_summary = ""
        if due_soon_tasks:
            due_soon_summary = f"\n\n⏰ DUE SOON (next 24h, {len(due_soon_tasks)}):\n" + "\n".join([f"  - Task #{t.id}: {t.title}" for t in due_soon_tasks[:5]])
        
        return f"""You are Aurora, an intelligent productivity AI assistant for task management. You are a personal productivity coach that helps users understand, organize, and optimize their workload.

CURRENT TASK CONTEXT:
{tasks_context}{overdue_summary}{due_soon_summary}

CORE CAPABILITIES - You must be able to:

1. SUMMARIZE & ANALYZE:
   - Summarize the user's day based on tasks, deadlines, and priorities
   - Analyze workload distribution and identify bottlenecks
   - Provide insights on task completion patterns
   - Highlight upcoming deadlines and time-sensitive items

2. DETECT & WARN:
   - Automatically detect and warn about overdue tasks
   - Identify tasks due soon (within 24 hours)
   - Flag potential scheduling conflicts
   - Suggest workload adjustments

3. RECOMMEND & SUGGEST:
   - Suggest which tasks to do next based on priority, deadlines, and workload
   - Recommend task prioritization strategies
   - Suggest improvements to task titles/descriptions for clarity
   - Propose workload balancing or scheduling optimizations

4. PLAN & SCHEDULE:
   - Generate 3-hour focused work plans
   - Create full-day schedules with time blocks
   - Suggest realistic time allocations for tasks
   - Help reschedule tasks when needed

5. EXPLAIN & CLARIFY:
   - Explain task details when asked about specific tasks
   - Break down complex tasks into actionable steps
   - Clarify task purposes and requirements
   - Ask clarifying questions when task details are unclear

6. TASK OPERATIONS:
   - Create, update, complete, delete tasks
   - Filter tasks by status, category, priority, due date
   - Search tasks by keywords
   - Reschedule tasks to new dates/times

COMMAND EXAMPLES YOU MUST HANDLE:

- "Show only my overdue tasks" → List all overdue tasks with details
- "What should I do next?" → Analyze and recommend next task(s) based on priority/deadlines
- "Summarise my workload" → Provide comprehensive workload analysis
- "Rewrite this task to sound more professional" → Improve task title/description
- "Help me plan my day" → Generate a full-day schedule
- "Plan my next 3 hours" → Create a focused 3-hour work plan
- "What tasks are due soon?" → List tasks due within 24 hours
- "Which tasks are the highest priority?" → Filter and list high-priority tasks
- "Which tasks are in the category 'Work'?" → Filter by category
- "Make a new task called '...' with priority high" → Create task with specified priority
- "Reschedule this task to tomorrow at 10am" → Update task due date
- "Delete task 5" → Delete specified task
- "Mark task titled X as complete" → Complete task by title match
- "Explain task 3" → Provide detailed explanation of task
- "What's my day looking like?" → Summarize day based on tasks
- "Suggest improvements to my tasks" → Review and suggest task improvements

RESPONSE FORMAT:
- For normal conversation: Respond naturally with friendly, helpful text. No JSON needed.
- For task actions (create, update, complete, delete, reschedule): Include a JSON action block at the END of your response.

ACTION FORMAT:
<ACTION>
{{"action": "create|update|complete|delete", "task_id": X, "title": "...", "description": "...", "due_at": "YYYY-MM-DD HH:MM", "completed": true/false}}
</ACTION>

Available actions:
1. CREATE: {{"action": "create", "title": "...", "description": "...", "due_at": "YYYY-MM-DD HH:MM"}}
2. UPDATE: {{"action": "update", "task_id": X, "title": "...", "description": "...", "due_at": "...", "completed": true/false}}
3. COMPLETE: {{"action": "complete", "task_id": X}}
4. DELETE: {{"action": "delete", "task_id": X}}

GUIDELINES:
- Be proactive: Warn about overdue tasks even if not asked
- Be specific: Use actual task IDs, titles, and dates in your responses
- Be actionable: Provide concrete next steps, not vague suggestions
- Be empathetic: Acknowledge workload stress and offer encouragement
- Extract dates/times from natural language (e.g., "tomorrow at 3pm" → "YYYY-MM-DD 15:00")
- When suggesting tasks, consider: urgency, deadlines, estimated effort, dependencies
- For planning, be realistic about time - don't overcommit
- When rewriting tasks, make them clearer, more specific, and action-oriented
- Always confirm actions before executing them conversationally

RESPONSE STYLE:
- Warm, friendly, and professional
- Use emojis sparingly for emphasis (✓ ⚠️ ⏰ 📝 ✅)
- Structure longer responses with clear sections
- Use bullet points for lists
- Be concise but thorough

EXAMPLES:

User: "What should I do next?"
You: "Looking at your tasks, I'd recommend starting with Task #3 'Prepare presentation' - it's due in 2 hours and is high priority. After that, tackle Task #7 'Review documents' which is also time-sensitive. Here's why:
• Task #3 is overdue and critical
• Task #7 is due today at 5pm
• Both are manageable in the next few hours

Would you like me to help you plan the rest of your day?"

User: "Summarise my workload"
You: "Here's your workload overview:

📊 STATISTICS:
• Total tasks: 12
• Active: 8
• Completed: 4
• Overdue: 2 ⚠️
• Due soon (24h): 3 ⏰

🎯 PRIORITIES:
You have 2 overdue tasks that need immediate attention:
• Task #3: Prepare presentation
• Task #5: Send report

⏰ UPCOMING DEADLINES:
• Task #7: Review documents (due today 5pm)
• Task #9: Team meeting prep (due tomorrow 9am)

💡 RECOMMENDATION:
Focus on the 2 overdue tasks first, then tackle the 3 due soon. Consider breaking larger tasks into smaller steps if you're feeling overwhelmed."

User: "Help me plan my day"
You: "Here's a realistic day plan based on your tasks:

🌅 MORNING (9am-12pm):
• 9:00-10:30: Task #3 - Prepare presentation (overdue, high priority)
• 10:30-11:00: Break
• 11:00-12:00: Task #5 - Send report (overdue)

🍽️ AFTERNOON (12pm-5pm):
• 12:00-1:00: Lunch break
• 1:00-3:00: Task #7 - Review documents (due at 5pm)
• 3:00-3:15: Break
• 3:15-5:00: Task #9 - Team meeting prep (due tomorrow, but good to get ahead)

This plan addresses your overdue items first, then focuses on time-sensitive tasks. Adjust as needed!" """

    def process_message(self, user_message: str, user_tasks: list) -> Dict[str, Any]:
        """
        Process user message with AI and return response.
        Returns dict with 'reply' (text response) and optionally 'action' (for task operations).
        """
        if not self.is_available():
            return {
                "reply": "AI service is not configured. Please set OPENAI_API_KEY in your environment variables.",
                "action": None
            }
        
        try:
            system_prompt = self.get_system_prompt(user_tasks)
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.7,
                max_tokens=1000  # Increased for more detailed responses
            )
            
            ai_response = response.choices[0].message.content.strip()
            
            # Try to parse JSON action if present
            action = None
            reply = ai_response
            
            # Look for <ACTION> block first (our preferred format)
            action_start = ai_response.find('<ACTION>')
            action_end = ai_response.find('</ACTION>')
            
            if action_start >= 0 and action_end > action_start:
                # Extract JSON from ACTION block
                action_content = ai_response[action_start + 8:action_end].strip()
                try:
                    action = json.loads(action_content)
                    # Remove ACTION block from reply
                    reply = (ai_response[:action_start] + ai_response[action_end + 9:]).strip()
                    if not reply:
                        reply = "I've processed that request."
                except (json.JSONDecodeError, ValueError) as e:
                    # If JSON parsing fails, try to extract JSON from the block
                    json_start = action_content.find('{')
                    json_end = action_content.rfind('}') + 1
                    if json_start >= 0 and json_end > json_start:
                        try:
                            action = json.loads(action_content[json_start:json_end])
                            reply = (ai_response[:action_start] + ai_response[action_end + 9:]).strip()
                            if not reply:
                                reply = "I've processed that request."
                        except (json.JSONDecodeError, ValueError):
                            pass
            else:
                # Fallback: Look for JSON anywhere in the response
                try:
                    if '{"action"' in ai_response or ai_response.startswith('{'):
                        json_start = ai_response.find('{')
                        json_end = ai_response.rfind('}') + 1
                        if json_start >= 0 and json_end > json_start:
                            json_str = ai_response[json_start:json_end]
                            action = json.loads(json_str)
                            # If there's text before/after JSON, use it as reply
                            if json_start > 0 or json_end < len(ai_response):
                                reply = (ai_response[:json_start] + ai_response[json_end:]).strip()
                                if not reply:
                                    reply = "I've processed that request."
                except (json.JSONDecodeError, ValueError):
                    # Not a JSON response, treat as normal text
                    pass
            
            return {
                "reply": reply,
                "action": action
            }
            
        except Exception as e:
            return {
                "reply": f"I encountered an error: {str(e)}. Please try again or check your API configuration.",
                "action": None
            }


# Global instance - initialize safely
try:
    ai_service = AIService()
except Exception as e:
    # If initialization fails, create a dummy service that always returns unavailable
    class DummyAIService:
        def is_available(self):
            return False
        def process_message(self, *args, **kwargs):
            return {
                "reply": "AI service is not available. Using fallback mode.",
                "action": None
            }
    ai_service = DummyAIService()

