# Task Manager with AI Assistant (Aurora)

A full-stack task management application built with Django REST Framework and React, featuring an AI-powered conversational assistant for natural language task management.

## ✨ Features

- **JWT-secured REST API** for creating, updating, and deleting tasks
- **AI-powered assistant (Aurora)** with natural language understanding via OpenAI integration
- **Natural language task creation** - "Create a task to pay rent tomorrow at 5pm"
- **Multi-step task creation flow** with intelligent follow-up questions
- **Persistent chat history** with clear/reset functionality
- **Floating, draggable assistant UI** with responsive design
- **Smart task management** - bulk operations, filtering, prioritization
- **User authentication** - secure login, registration, and password reset
- **Due date/time tracking** with overdue detection and notifications
- **Modern React dashboard** with stats, filters, and timeline details

## 🚀 Quick Start

### Prerequisites

- Python 3.8+ 
- Node.js 16+ and npm
- (Optional) OpenAI API key for AI assistant features

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment:**
   ```bash
   python -m venv .venv
   
   # On Windows:
   .venv\Scripts\activate
   
   # On macOS/Linux:
   source .venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   - Database settings (SQLite by default, no setup needed)
   - CORS origins (default: `http://localhost:5173`)
   - (Optional) OpenAI API key for AI features

5. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

6. **Create superuser (for admin access):**
   ```bash
   python manage.py createsuperuser
   ```

7. **Start the development server:**
   ```bash
   python manage.py runserver 8000
   ```

   The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

### First Time Setup

1. Open `http://localhost:5173` in your browser
2. Click "Login" and create a new account
3. Start creating tasks or chat with Aurora, the AI assistant!

## 🤖 AI Assistant Setup (Optional)

The AI assistant (Aurora) provides natural language task management. It works without an API key using pattern matching, but for the best experience, set up OpenAI integration:

1. **Get an OpenAI API key:**
   - Visit [OpenAI Platform](https://platform.openai.com/api-keys)
   - Create an account and generate an API key

2. **Add to backend `.env` file:**
   ```bash
   OPENAI_API_KEY=your-api-key-here
   OPENAI_MODEL=gpt-4o-mini  # Optional: defaults to gpt-4o-mini
   ```

3. **Restart the Django server**

### AI Assistant Features

With OpenAI integration, Aurora can:
- Understand natural language commands ("Create a task to call mom tomorrow at 3pm")
- Ask intelligent follow-up questions for task details
- Provide context-aware responses about your tasks
- Help with planning and prioritization
- Engage in friendly conversation

Without the API key, Aurora still works using pattern matching for basic commands.

## 📁 Project Structure

```
Task_Manager/
├── backend/              # Django REST API
│   ├── tasks/           # Task models and views
│   ├── accounts/        # User authentication
│   ├── manage.py
│   └── requirements.txt
├── frontend/            # React application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── contexts/    # React context providers
│   │   ├── pages/       # Page components
│   │   ├── utils/       # Utility functions
│   │   └── services/    # API services
│   └── package.json
└── README.md
```

## 🔧 Configuration

### Database Options

**SQLite (Default - No setup required)**
- Works out of the box
- Perfect for development and small deployments

**MySQL/MariaDB (Optional)**
1. Install MySQL client libraries:
   ```bash
   # Debian/Ubuntu
   sudo apt-get install libmysqlclient-dev
   
   # macOS
   brew install mysql-client
   ```

2. Update `.env`:
   ```bash
   DB_ENGINE=mysql
   DB_NAME=taskmanager
   DB_USER=your_user
   DB_PASSWORD=your_password
   DB_HOST=127.0.0.1
   DB_PORT=3306
   ```

3. Run migrations:
   ```bash
   python manage.py migrate
   ```

### Docker MariaDB (Optional)

For local MariaDB testing:
```bash
docker compose -f docker-compose.mariadb.yml up -d

# Run migrations
DB_ENGINE=mysql DB_NAME=taskmanager DB_USER=taskuser DB_PASSWORD=taskpass DB_HOST=127.0.0.1 DB_PORT=3306 \
  python manage.py migrate
```

## 🎯 Usage

### Creating Tasks

**Via Form:**
- Click "New Task" in the navigation
- Fill in title, description, and optional due date/time
- Click "Save task"

**Via AI Assistant:**
- Click the cloud icon (☁️) in the bottom-right
- Say: "Create a task to buy groceries tomorrow at 2pm"
- Aurora will guide you through the process

### Managing Tasks

- **View all tasks:** Click "Tasks" in navigation
- **Filter tasks:** Use the filter buttons (All, Active, Completed)
- **Edit task:** Click "Edit" on any task card
- **Complete task:** Click "Mark done" or use the checkbox
- **Delete task:** Click "Delete" on any task card

### AI Assistant Commands

Try these with Aurora:
- "Create a task called..."
- "What tasks are due today?"
- "Delete all tasks" (with confirmation)
- "Clear chat" (start fresh conversation)
- "What can you do?" (see all capabilities)
- "Plan my day"
- "I'm stressed" (get help prioritizing)

## 🛠️ Development

### Building for Production

**Frontend:**
```bash
cd frontend
npm run build
```

**Backend:**
```bash
cd backend
python manage.py collectstatic  # If using static files
```

### Running Tests

```bash
# Backend tests
cd backend
python manage.py test

# Frontend tests (if configured)
cd frontend
npm test
```

## 📝 API Endpoints

- `POST /api/register/` - User registration
- `POST /api/token/` - Get JWT token (login)
- `POST /api/token/refresh/` - Refresh JWT token
- `GET /api/tasks/` - List all tasks (authenticated)
- `POST /api/tasks/` - Create new task
- `GET /api/tasks/{id}/` - Get task details
- `PUT /api/tasks/{id}/` - Update task
- `DELETE /api/tasks/{id}/` - Delete task
- `POST /api/tasks/delete-all/` - Delete all tasks (bulk)

## 🔒 Security

- JWT-based authentication
- Password hashing with Django's PBKDF2
- CORS protection
- SQL injection protection (Django ORM)
- XSS protection (React)

## 📦 Dependencies

**Backend:**
- Django 4.2+
- Django REST Framework
- djangorestframework-simplejwt
- django-cors-headers
- openai (optional, for AI features)

**Frontend:**
- React 18+
- React Router
- Vite
- Axios

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available for personal and educational use.

## 🙏 Acknowledgments

- Built with Django and React
- AI features powered by OpenAI
- UI inspired by modern productivity tools

## 📞 Support

For issues, questions, or contributions, please open an issue on GitHub.

---

**Repository:** https://github.com/GielinorR-S/Task_Manager

**Happy task managing! 🎉**
