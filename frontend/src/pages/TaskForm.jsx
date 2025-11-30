import React, {useState, useEffect} from 'react'
import api from '../api'
import { Link, useNavigate, useParams } from 'react-router-dom'

export default function TaskForm(){
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [completed, setCompleted] = useState(false)
  const navigate = useNavigate()
  const params = useParams()

  useEffect(()=>{
    if(params.id) loadTask()
  },[params.id])

  async function loadTask(){
    const res = await api.get(`/tasks/${params.id}/`)
    setTitle(res.data.title)
    setDescription(res.data.description)
    setCompleted(res.data.completed)
  }

  async function save(e){
    e.preventDefault()
    const payload = {title, description, completed}
    try{
      if(params.id){
        await api.put(`/tasks/${params.id}/`, payload)
      }else{
        await api.post('/tasks/', payload)
      }
      navigate('/')
    }catch(err){
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
  )
}
