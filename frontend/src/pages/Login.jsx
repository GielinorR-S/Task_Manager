import React, {useState} from 'react'
import api from '../api'
import { saveTokens } from '../auth'
import { useNavigate } from 'react-router-dom'

export default function Login(){
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  async function submit(e){
    e.preventDefault()
    try{
      const res = await api.post('/token/', {username, password})
      console.log('Login response:', res)
      saveTokens(res.data)
      alert('Login successful!')
      navigate('/')
    }catch(err){
      console.error('Login error (raw):', err)
      // Show useful server response details when available
      const serverData = err?.response?.data
      console.error('Login error (response data):', serverData)
      const message = serverData ? JSON.stringify(serverData) : (err.message || 'Login failed')
      // show a readable message to the user and also log details to console
      alert('Login failed: ' + message)
    }
  }

  return (
    <form onSubmit={submit}>
      <div>
        <label>Username</label>
        <input value={username} onChange={e=>setUsername(e.target.value)} required />
      </div>
      <div>
        <label>Password</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
      </div>
      <button type="submit">Login</button>
    </form>
  )
}
