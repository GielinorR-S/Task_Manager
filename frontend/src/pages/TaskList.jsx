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
    <div>
      <h2>Tasks</h2>
      <ul>
        {tasks.map(t=> (
          <li key={t.id}>
            <strong>{t.title}</strong> {t.completed? '✔️':''}
            <div>
              <Link to={`/tasks/${t.id}/edit`}>Edit</Link> |
              <button onClick={()=>removeTask(t.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
