import React, { useEffect, useMemo, useState } from 'react'
import api from '../api'
import { Link } from 'react-router-dom'

const FILTERS = {
  all: 'All',
  active: 'Active',
  completed: 'Completed',
}

function formatDateTime(value) {
  if (!value) return 'No due date set'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getDueDetails(due_at, completed) {
  if (!due_at) return { label: 'No schedule', tone: 'muted' }
  const now = new Date()
  const dueDate = new Date(due_at)

  if (completed) return { label: 'Completed', tone: 'success' }
  if (dueDate < now) return { label: 'Overdue', tone: 'danger' }

  const diffHours = Math.round((dueDate - now) / (1000 * 60 * 60))
  if (diffHours <= 3) return { label: 'Due soon', tone: 'warning' }

  return { label: 'Scheduled', tone: 'success' }
}

export default function TaskList() {
  const [tasks, setTasks] = useState([])
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchTasks()
  }, [])

  async function fetchTasks() {
    try {
      const res = await api.get('/tasks/')
      setTasks(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  async function toggleComplete(task) {
    try {
      const payload = {
        title: task.title,
        description: task.description,
        completed: !task.completed,
        due_at: task.due_at,
      }
      await api.put(`/tasks/${task.id}/`, payload)
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: payload.completed } : t)))
    } catch (err) {
      console.error(err)
    }
  }

  async function removeTask(id) {
    if (!confirm('Delete task?')) return
    await api.delete(`/tasks/${id}/`)
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  const stats = useMemo(() => {
    const completed = tasks.filter((t) => t.completed).length
    const upcoming = tasks.filter((t) => !t.completed && t.due_at).length
    return { total: tasks.length, completed, upcoming }
  }, [tasks])

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'active') return !task.completed
    if (filter === 'completed') return task.completed
    return true
  })

  return (
    <section className="stack-lg">

      {/* HEADER */}
      <div className="section-header">
        <div>
          <p className="eyebrow">Overview</p>
          <h3>Task dashboard</h3>
          <p className="muted">Track progress, deadlines, and keep work flowing.</p>
        </div>
        <Link className="button" to="/tasks/new">
          + New Task
        </Link>
      </div>

      {/* STATS */}
      <div className="stat-grid">
        <div className="stat-card">
          <p className="eyebrow">Total</p>
          <h4>{stats.total}</h4>
          <p className="muted">Tasks in your workspace</p>
        </div>
        <div className="stat-card">
          <p className="eyebrow">Completed</p>
          <h4>{stats.completed}</h4>
          <p className="muted">Checked off and done</p>
        </div>
        <div className="stat-card">
          <p className="eyebrow">Scheduled</p>
          <h4>{stats.upcoming}</h4>
          <p className="muted">With due dates & times</p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="filters">
        {Object.entries(FILTERS).map(([key, label]) => (
          <button
            key={key}
            className={`chip ${filter === key ? 'is-active' : ''}`}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* TASK GRID */}
      {filteredTasks.length > 0 ? (
        <div className="task-grid">
          {filteredTasks.map((task) => {
            const due = getDueDetails(task.due_at, task.completed)
            const overdue = due.tone === 'danger'

            return (
              <article
                key={task.id}
                className={`task-card ${task.completed ? 'is-done' : ''} ${
                  overdue ? 'is-overdue' : ''
                }`}
              >
                <header className="task-card__header">
                  <div className="task-meta">
                    <div className="task-badges">
                      <span className={`badge ${task.completed ? 'success' : 'info'}`}>
                        {task.completed ? 'Completed' : 'Active'}
                      </span>
                      <span className={`badge tone-${due.tone}`}>{due.label}</span>
                    </div>
                    <h4>{task.title}</h4>
                  </div>

                  <div className="task-actions">
                    <button className="ghost" onClick={() => toggleComplete(task)}>
                      {task.completed ? 'Mark active' : 'Mark done'}
                    </button>

                    <Link className="ghost" to={`/tasks/${task.id}/edit`}>
                      Edit
                    </Link>

                    <button className="ghost danger" onClick={() => removeTask(task.id)}>
                      Delete
                    </button>
                  </div>
                </header>

                <p className="muted">{task.description || 'No description provided.'}</p>

                <dl className="timeline">
                  <div>
                    <dt>Due</dt>
                    <dd>{formatDateTime(task.due_at)}</dd>
                  </div>
                  <div>
                    <dt>Created</dt>
                    <dd>{formatDateTime(task.created_at)}</dd>
                  </div>
                  <div>
                    <dt>Updated</dt>
                    <dd>{formatDateTime(task.updated_at)}</dd>
                  </div>
                </dl>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="empty-state">
          <p className="eyebrow">Nothing here yet</p>
          <p className="muted">Create a task to start tracking work and due dates.</p>
          <Link className="button" to="/tasks/new">
            Create your first task
          </Link>
        </div>
      )}
    </section>
  )
}
