import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTasks } from '../contexts/TaskContext'
import { formatDateTime, getDueDetails } from '../utils/dateUtils'

const FILTERS = {
  all: 'All',
  active: 'Active',
  completed: 'Completed',
}

// Memoized task card component to prevent unnecessary re-renders
const TaskCard = React.memo(({ task, onToggleComplete, onDelete }) => {
  const due = useMemo(() => getDueDetails(task.due_at, task.completed), [task.due_at, task.completed])
  const overdue = due.tone === 'danger'
  
  const handleToggle = useCallback(() => {
    onToggleComplete(task)
  }, [task, onToggleComplete])
  
  const handleDelete = useCallback(() => {
    onDelete(task.id)
  }, [task.id, onDelete])

  return (
    <article
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
          <button className="ghost" onClick={handleToggle}>
            {task.completed ? 'Mark active' : 'Mark done'}
          </button>

          <Link className="ghost" to={`/tasks/${task.id}/edit`}>
            Edit
          </Link>

          <button className="ghost danger" onClick={handleDelete}>
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
})

TaskCard.displayName = 'TaskCard'

export default function TaskList() {
  const { tasks, fetchTasks, toggleComplete, deleteTask } = useTasks()
  const [filter, setFilter] = useState('all')
  const notifiedRef = useRef(new Set())
  const lastNotificationCheck = useRef(0)

  // Request notification permission once
  useEffect(() => {
    if (typeof Notification === 'undefined') return
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
  }, [])

  // Optimized notification check - only run every 30 seconds and only for active tasks
  useEffect(() => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return

    const now = Date.now()
    // Throttle notification checks to every 30 seconds
    if (now - lastNotificationCheck.current < 30000) return
    lastNotificationCheck.current = now

    const soonMs = 15 * 60 * 1000 // 15 minutes
    const currentTime = new Date()

    // Only check active tasks with due dates
    const activeTasksWithDueDates = tasks.filter(t => !t.completed && t.due_at)
    
    activeTasksWithDueDates.forEach((task) => {
      const due = new Date(task.due_at)
      const diff = due - currentTime
      if (diff > 0 && diff <= soonMs && !notifiedRef.current.has(task.id)) {
        notifiedRef.current.add(task.id)
        try {
          new Notification('Task due soon', {
            body: `${task.title} at ${formatDateTime(task.due_at)}`,
          })
        } catch (e) {
          console.error('Notification error', e)
        }
      }
    })
  }, [tasks]) // Only re-run when tasks array reference changes

  // Fetch tasks only once on mount
  useEffect(() => {
    fetchTasks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  const handleToggleComplete = useCallback(async (task) => {
    try {
      await toggleComplete(task)
    } catch (err) {
      console.error(err)
    }
  }, [toggleComplete])

  const handleRemoveTask = useCallback(async (id) => {
    if (!confirm('Delete task?')) return
    try {
      await deleteTask(id)
    } catch (err) {
      console.error(err)
    }
  }, [deleteTask])

  const stats = useMemo(() => {
    const completed = tasks.filter((t) => t.completed).length
    const upcoming = tasks.filter((t) => !t.completed && t.due_at).length
    return { total: tasks.length, completed, upcoming }
  }, [tasks])

  const filteredTasks = useMemo(() => {
    if (filter === 'active') return tasks.filter((task) => !task.completed)
    if (filter === 'completed') return tasks.filter((task) => task.completed)
    return tasks
  }, [tasks, filter])

  const handleFilterChange = useCallback((newFilter) => {
    setFilter(newFilter)
  }, [])

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
            onClick={() => handleFilterChange(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* TASK GRID */}
      {filteredTasks.length > 0 ? (
        <div className="task-grid">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleComplete={handleToggleComplete}
              onDelete={handleRemoveTask}
            />
          ))}
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

