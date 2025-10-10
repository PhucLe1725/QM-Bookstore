import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { Client } from '@stomp/stompjs'

const WebSocketContext = createContext()

export const useWebSocket = () => {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
}

export const WebSocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState([])
  const clientRef = useRef(null)

  useEffect(() => {
    // Khởi tạo WebSocket connection
    const client = new Client({
      brokerURL: 'ws://localhost:8080/ws', // Thay đổi URL này theo server của bạn
      connectHeaders: {
        // Thêm headers nếu cần thiết
      },
      debug: function (str) {
        console.log('STOMP: ' + str)
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    })

    client.onConnect = function (frame) {
      console.log('Connected: ' + frame)
      setIsConnected(true)

      // Subscribe to topics
      client.subscribe('/topic/messages', function (message) {
        const messageData = JSON.parse(message.body)
        setMessages(prev => [...prev, messageData])
      })

      // Subscribe to user-specific messages
      client.subscribe('/user/queue/private-messages', function (message) {
        const messageData = JSON.parse(message.body)
        setMessages(prev => [...prev, messageData])
      })
    }

    client.onStompError = function (frame) {
      console.error('Broker reported error: ' + frame.headers['message'])
      console.error('Additional details: ' + frame.body)
      setIsConnected(false)
    }

    client.onWebSocketClose = function (event) {
      console.log('WebSocket connection closed')
      setIsConnected(false)
    }

    client.onDisconnect = function () {
      console.log('Disconnected')
      setIsConnected(false)
    }

    clientRef.current = client
    client.activate()

    // Cleanup function
    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate()
      }
    }
  }, [])

  const sendMessage = (destination, message) => {
    if (clientRef.current && isConnected) {
      clientRef.current.publish({
        destination: destination,
        body: JSON.stringify(message)
      })
    } else {
      console.error('WebSocket is not connected')
    }
  }

  const value = {
    isConnected,
    messages,
    sendMessage,
    client: clientRef.current
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}