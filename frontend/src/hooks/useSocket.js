import { useEffect, useRef, useContext } from 'react'
import { io } from 'socket.io-client'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { AuthContext } from '../context/AuthContext'

const SOCKET_URL = 'http://localhost:8000'

export function useSocket(leadId) {
  const queryClient = useQueryClient()
  const { user } = useContext(AuthContext)
  const socketRef = useRef(null)

  useEffect(() => {
    // only connect if we have a user from AuthContext
    if (!user?.id) return

    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true
    })

    const s = socketRef.current

    s.on('connect', () => {
      console.log('Socket connected:', s.id)

      // join lead room if leadId provided
      if (leadId) {
        s.emit('join_lead_room', { lead_id: leadId })
        console.log(`Joined lead room: lead:${leadId}`)
      }

      // join user room using user.id from AuthContext
      // AuthContext stores user in memory — never localStorage
      s.emit('join_user_room', { user_id: user.id })
      console.log(`Joined user room: user:${user.id}`)
    })

    // new email received for this lead
    s.on('new_email', (data) => {
      toast.success(
        `New email: ${data.subject}`,
        { duration: 4000, icon: '📧' }
      )
      queryClient.invalidateQueries(['emails', leadId])
    })

    // new call recording captured for this lead
    s.on('new_call_recording', (data) => {
      toast.success(
        'New call recording available',
        { duration: 4000, icon: '📞' }
      )
      queryClient.invalidateQueries(['calls', leadId])
    })

    // lead stage changed
    s.on('lead_updated', (data) => {
      toast(
        `Stage changed to ${data.new_stage}`,
        { duration: 4000, icon: '🔄' }
      )
      queryClient.invalidateQueries(['lead', leadId])
      queryClient.invalidateQueries(['leads'])
    })

    // new in-app notification for this user
    s.on('new_notification', (data) => {
      toast(
        data.message,
        { duration: 5000, icon: '🔔' }
      )
      // invalidate notifications cache so bell badge updates instantly
      queryClient.invalidateQueries(['notifications'])
    })

    s.on('disconnect', () => {
      console.log('Socket disconnected')
    })

    s.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })

    // cleanup: leave rooms and disconnect on unmount
    return () => {
      if (leadId) {
        s.emit('leave_lead_room', { lead_id: leadId })
      }
      s.emit('leave_user_room', { user_id: user.id })
      s.disconnect()
    }

  }, [leadId, user?.id, queryClient])

  return socketRef.current
}
