import React, {useState, useEffect} from 'react'
import api from '../api'
import { useNavigate, useParams } from 'react-router-dom'

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
    <form onSubmit={save}>
      <div>
        <label>Title</label>
        <input value={title} onChange={e=>setTitle(e.target.value)} required />
      </div>
      <div>
        <label>Description</label>
        <textarea value={description} onChange={e=>setDescription(e.target.value)} />
      </div>
      <div>
        <label>
          <input type="checkbox" checked={completed} onChange={e=>setCompleted(e.target.checked)} /> Completed
        </label>
      </div>
      <button type="submit">Save</button>
    </form>
  )
}
