import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react'
import api from '../api'

const TaskContext = createContext(null)

export function TaskProvider({ children }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const fetchingRef = useRef(false) // Prevent duplicate fetches

  const fetchTasks = useCallback(async () => {
    // Prevent concurrent fetches
    if (fetchingRef.current) {
      return // Return early, don't return stale tasks
    }
    
    fetchingRef.current = true
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/tasks/')
      const newTasks = res.data || []
      setTasks(newTasks)
      return newTasks
    } catch (err) {
      console.error('Error fetching tasks:', err)
      setError(err.message || 'Failed to fetch tasks')
      return []
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, []) // Stable - no dependencies needed

  const createTask = useCallback(async (taskData) => {
    try {
      const res = await api.post('/tasks/', taskData)
      setTasks(prev => [...prev, res.data])
      return res.data
    } catch (err) {
      console.error('Error creating task:', err)
      throw err
    }
  }, [])

  const updateTask = useCallback(async (id, taskData) => {
    try {
      const res = await api.put(`/tasks/${id}/`, taskData)
      setTasks(prev => prev.map(t => t.id === id ? res.data : t))
      return res.data
    } catch (err) {
      console.error('Error updating task:', err)
      throw err
    }
  }, [])

  const deleteTask = useCallback(async (id) => {
    try {
      await api.delete(`/tasks/${id}/`)
      setTasks(prev => prev.filter(t => t.id !== id))
      return true
    } catch (err) {
      console.error('Error deleting task:', err)
      throw err
    }
  }, [])

  const toggleComplete = useCallback(async (task) => {
    return updateTask(task.id, {
      title: task.title,
      description: task.description,
      completed: !task.completed,
      due_at: task.due_at,
    })
  }, [updateTask])

  // Memoize filter/search functions - use functional updates to avoid stale closures
  const filterTasks = useCallback((filterFn) => {
    // Use functional state update to get latest tasks
    return filterFn ? tasks.filter(filterFn) : tasks
  }, [tasks])

  const searchTasks = useCallback((query) => {
    if (!query) return []
    const lowerQuery = query.toLowerCase()
    return tasks.filter(task => 
      task.title.toLowerCase().includes(lowerQuery) ||
      (task.description && task.description.toLowerCase().includes(lowerQuery))
    )
  }, [tasks])

  const deleteAllTasks = useCallback(async () => {
    try {
      const currentTasks = tasks // Capture current tasks
      const deletePromises = currentTasks.map(task => api.delete(`/tasks/${task.id}/`))
      await Promise.all(deletePromises)
      setTasks([])
      return true
    } catch (err) {
      console.error('Error deleting all tasks:', err)
      throw err
    }
  }, [tasks])

  const deleteCompletedTasks = useCallback(async () => {
    try {
      const completed = tasks.filter(t => t.completed)
      const deletePromises = completed.map(task => api.delete(`/tasks/${task.id}/`))
      await Promise.all(deletePromises)
      setTasks(prev => prev.filter(t => !t.completed))
      return completed.length
    } catch (err) {
      console.error('Error deleting completed tasks:', err)
      throw err
    }
  }, [tasks])

  const completeAllTasks = useCallback(async () => {
    try {
      const incomplete = tasks.filter(t => !t.completed)
      const updatePromises = incomplete.map(task => 
        api.put(`/tasks/${task.id}/`, {
          title: task.title,
          description: task.description,
          completed: true,
          due_at: task.due_at,
        })
      )
      const results = await Promise.all(updatePromises)
      setTasks(prev => prev.map(t => {
        const updated = results.find(r => r.id === t.id)
        return updated || t
      }))
      return incomplete.length
    } catch (err) {
      console.error('Error completing all tasks:', err)
      throw err
    }
  }, [tasks])

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleComplete,
    filterTasks,
    searchTasks,
    deleteAllTasks,
    deleteCompletedTasks,
    completeAllTasks,
    setTasks,
  }), [
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleComplete,
    filterTasks,
    searchTasks,
    deleteAllTasks,
    deleteCompletedTasks,
    completeAllTasks,
  ])

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>
}

export function useTasks() {
  const context = useContext(TaskContext)
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider')
  }
  return context
}

