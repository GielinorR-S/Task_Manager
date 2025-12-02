import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import TaskList from './pages/TaskList'
import TaskForm from './pages/TaskForm'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import './index.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<App />}>
          <Route index element={<TaskList/>} />
          <Route path='login' element={<Login/>} />
          <Route path='signup' element={<Signup/>} />
          <Route path='forgot-password' element={<ForgotPassword/>} />
          <Route path='reset-password' element={<ResetPassword/>} />
          <Route path='tasks/new' element={<TaskForm/>} />
          <Route path='tasks/:id/edit' element={<TaskForm/>} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
