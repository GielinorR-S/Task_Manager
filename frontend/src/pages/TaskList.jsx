import React, {useEffect, useState} from 'react'
import api from '../api'
import { Link } from 'react-router-dom'

export default function TaskList(){
  const [tasks, setTasks] = useState([])

  useEffect(()=>{
    fetchTasks()
  },[])

  async function fetchTasks(){
    try{
      const res = await api.get('/tasks/')
      setTasks(res.data)
    }catch(err){
      console.error(err)
    }
  }

  async function removeTask(id){
    if(!confirm('Delete task?')) return
    await api.delete(`/tasks/${id}/`)
    setTasks(tasks.filter(t=>t.id!==id))
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <p className="helper-text" style={{margin: 0}}>Create and track tasks with due dates and status.</p>
          <h2 style={{margin: 0}}>Task dashboard</h2>
        </div>
        <Link to="/tasks/new" className="primary-btn">New task</Link>
      </div>

      {tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🗂️</div>
          <h3 className="empty-title">No tasks yet</h3>
          <p className="empty-text">Create a task to start tracking work and due dates.</p>
          <Link to="/tasks/new" className="primary-btn">Create your first task</Link>
        </div>
      ) : (
        <ul className="card-grid">
          {tasks.map(t=> (
            <li key={t.id} className="task-card">
              <header>
                <div>
                  <p className="helper-text" style={{margin: 0}}>Task #{t.id}</p>
                  <h3 className="task-title">{t.title}</h3>
                </div>
                <span className={`pill ${t.completed ? 'complete' : 'incomplete'}`}>
                  {t.completed ? 'Completed' : 'In progress'}
                </span>
              </header>
              {t.description && <p className="task-meta">{t.description}</p>}
              <div className="task-actions">
                <Link to={`/tasks/${t.id}/edit`} className="ghost-btn">Edit</Link>
                <button type="button" onClick={()=>removeTask(t.id)} className="ghost-btn">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
