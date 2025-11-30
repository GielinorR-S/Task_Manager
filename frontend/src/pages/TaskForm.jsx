import React, { useState, useEffect } from 'react'
import api from '../api'
import { Link, useNavigate, useParams } from 'react-router-dom'

function toLocalInputValue(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  const offsetMs = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

function toISOFromLocal(localValue) {
  if (!localValue) return null
  const date = new Date(localValue)
  const offsetMs = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offsetMs).toISOString()
}

export default function TaskForm() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [completed, setCompleted] = useState(false)
  const [dueAt, setDueAt] = useState('')
  const navigate = useNavigate()
  const params = useParams()

  useEffect(() => {
    if (params.id) loadTask()
  }, [params.id])

  async function loadTask() {
    const res = await api.get(`/tasks/${params.id}/`)
    setTitle(res.data.title)
    setDescription(res.data.description)
    setCompleted(res.data.completed)
    setDueAt(toLocalInputValue(res.data.due_at))
  }

  async function save(e) {
    e.preventDefault()
    const payload = {
      title,
      description,
      completed,
      due_at: toISOFromLocal(dueAt),
    }
    try {
      if (params.id) {
        await api.put(`/tasks/${params.id}/`, payload)
      } else {
        await api.post('/tasks/', payload)
      }
      navigate('/')
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <p className="helper-text" style={{margin: 0}}>{params.id ? 'Update task details' : 'Create a task with title and description'}</p>
          <h2 style={{margin: 0}}>{params.id ? 'Edit task' : 'New task'}</h2>
        </div>
      </div>

      <form onSubmit={save} className="form-card">
        <div className="form-group">
          <label>Title</label>
          <input value={title} onChange={e=>setTitle(e.target.value)} required placeholder="Write a clear task title" />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Add context, notes, or requirements" />
        </div>
        <div className="form-group">
          <label className="helper-text" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <input type="checkbox" checked={completed} onChange={e=>setCompleted(e.target.checked)} /> Mark as completed
          </label>
        </div>
        <div className="form-actions">
          <Link to="/" className="ghost-btn">Cancel</Link>
          <button type="submit" className="primary-btn">Save task</button>
        </div>
      </form>
    </section>
    <form className="form" onSubmit={save}>
      <div className="form-header">
        <div>
          <p className="eyebrow">Planner</p>
          <h3>{params.id ? 'Edit task' : 'Create a new task'}</h3>
          <p className="muted">Set clear goals, describe the work, and schedule a due date & time.</p>
        </div>
        <div className="form-actions">
          <label className="checkbox">
            <input type="checkbox" checked={completed} onChange={(e) => setCompleted(e.target.checked)} /> Completed
          </label>
          <button type="submit" className="button">
            Save task
          </button>
        </div>
      </div>

      <div className="field-grid">
        <label className="field">
          <span>Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="What needs to get done?" />
        </label>

        <label className="field">
          <span>Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add context, steps, or acceptance criteria."
            rows={4}
          />
        </label>

        <label className="field">
          <span>Due date & time</span>
          <input
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            placeholder="Set when this should be done"
          />
          <p className="muted small">Optional—leave blank if this task doesn&apos;t have a deadline.</p>
        </label>
      </div>
    </form>
  )
}
