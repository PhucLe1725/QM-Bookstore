# WebSocket Implementation Guide for Backend

## Overview
This guide covers the complete WebSocket implementation including:
- Basic WebSocket configuration
- **NEW: Real-time admin notifications system**
- **NEW: Dynamic conversation subscriptions**
- **NEW: Typing indicators and user status**

## Spring Boot WebSocket Configuration

### 1. Dependencies (pom.xml)
```xml
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-messaging</artifactId>
</dependency>
```

### 2. WebSocket Configuration
```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable broker for these destinations
        config.enableSimpleBroker("/topic", "/queue", "/user");
        
        // Prefix for messages FROM client TO server
        config.setApplicationDestinationPrefixes("/app");
        
        // Prefix for user-specific messages
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // WebSocket endpoint that frontend connects to
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // Configure for production
                .withSockJS(); // Enable SockJS fallback
    }
}
```

### 3. Message Controller
```java
@Controller
public class ChatController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    private ChatService chatService;

    // Receive public messages and broadcast to all
    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/messages")
    public ChatMessageDto sendMessage(
            @Payload ChatMessageDto chatMessage,
            SimpMessageHeaderAccessor headerAccessor) {
        
        // Save message to database
        ChatMessageDto savedMessage = chatService.saveMessage(chatMessage);
        
        // Return message will be broadcasted to /topic/messages
        return savedMessage;
    }

    // Receive private messages
    @MessageMapping("/chat.sendPrivateMessage")
    public void sendPrivateMessage(
            @Payload ChatMessageDto chatMessage,
            SimpMessageHeaderAccessor headerAccessor) {
        
        // Save message to database
        ChatMessageDto savedMessage = chatService.saveMessage(chatMessage);
        
        // Send to specific user
        messagingTemplate.convertAndSendToUser(
            chatMessage.getReceiverId(),
            "/queue/private-messages",
            savedMessage
        );
        
        // Also send back to sender for confirmation
        messagingTemplate.convertAndSendToUser(
            chatMessage.getSenderId(),
            "/queue/private-messages", 
            savedMessage
        );
    }

    // Receive messages to admin
    @MessageMapping("/chat.sendToAdmin")
    @SendTo("/topic/admin-messages")
    public ChatMessageDto sendToAdmin(
            @Payload ChatMessageDto chatMessage,
            SimpMessageHeaderAccessor headerAccessor) {
        
        // Save message to database
        ChatMessageDto savedMessage = chatService.saveMessage(chatMessage);
        
        // Broadcast to all admins listening to /topic/admin-messages
        return savedMessage;
    }

    // Handle user connection
    @MessageMapping("/chat.addUser")
    @SendTo("/topic/messages")
    public ChatMessageDto addUser(
            @Payload ChatMessageDto chatMessage,
            SimpMessageHeaderAccessor headerAccessor) {
        
        // Add user to session
        headerAccessor.getSessionAttributes().put("username", chatMessage.getSenderId());
        
        return chatMessage;
    }
}
```

### 4. ChatMessageDto
```java
public class ChatMessageDto {
    private Long id;
    private String senderId;     // UUID của user gửi
    private String receiverId;   // UUID của user nhận (null cho public)
    private String message;      // Nội dung tin nhắn
    private SenderType senderType; // ADMIN, USER, CHATBOT
    private LocalDateTime createdAt;
    
    // Constructors, getters, setters
    
    public enum SenderType {
        ADMIN, USER, CHATBOT
    }
}
```

### 5. Chat Service
```java
@Service
@Transactional
public class ChatService {
    
    @Autowired
    private ChatMessageRepository chatMessageRepository;
    
    public ChatMessageDto saveMessage(ChatMessageDto messageDto) {
        ChatMessage entity = new ChatMessage();
        entity.setSenderId(messageDto.getSenderId());
        entity.setReceiverId(messageDto.getReceiverId());
        entity.setMessage(messageDto.getMessage());
        entity.setSenderType(messageDto.getSenderType());
        entity.setCreatedAt(LocalDateTime.now());
        
        ChatMessage saved = chatMessageRepository.save(entity);
        
        return convertToDto(saved);
    }
    
    public List<ChatMessageDto> getMessagesBetweenUsers(String user1Id, String user2Id) {
        List<ChatMessage> messages = chatMessageRepository
            .findMessagesBetweenUsers(user1Id, user2Id);
        
        return messages.stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }
    
    public List<ChatMessageDto> getPublicMessages() {
        List<ChatMessage> messages = chatMessageRepository
            .findByReceiverIdIsNullOrderByCreatedAtDesc();
            
        return messages.stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }
    
    private ChatMessageDto convertToDto(ChatMessage entity) {
        ChatMessageDto dto = new ChatMessageDto();
        dto.setId(entity.getId());
        dto.setSenderId(entity.getSenderId());
        dto.setReceiverId(entity.getReceiverId());
        dto.setMessage(entity.getMessage());
        dto.setSenderType(entity.getSenderType());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }
}
```

## 🆕 Real-time Admin Notification System

### 1. New WebSocket Channels

#### Admin Notification Channel
**Purpose**: Notify all admin/managers when there's a new message in any conversation

**Channel**: `/topic/admin-notifications`

**Payload**: `AdminNotification`
```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminNotification {
    private String type;              // "conversation_update", "new_user_message"
    private UUID conversationUserId;  // User ID in conversation
    private Long messageId;          // Message ID
    private UUID senderId;           // Who sent the message
    private String senderUsername;   // Sender username for display
    private String messagePreview;   // First 50 chars of message
    private LocalDateTime timestamp; // When notification was created
}
```

#### Specific Conversation Channel
**Purpose**: Real-time updates for admins viewing a specific user's conversation

**Channel**: `/topic/conversation/{userId}`

**Payload**: `ConversationUpdate`
```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationUpdate {
    private String action;           // "new_message", "message_read", "typing_start", "typing_stop"
    private UUID userId;            // User in conversation
    private ChatMessageDto message; // Full message data (if action = new_message)
    private UUID actorId;          // Who performed the action
    private String actorUsername;  // Actor username
    private LocalDateTime timestamp;
}
```

### 2. Enhanced ChatController with Notifications

```java
@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatService chatService;
    private final NotificationService notificationService;

    @MessageMapping("/chat.sendPrivateMessage")
    public void handlePrivateMessage(
            @Payload PrivateMessageRequest message,
            SimpMessageHeaderAccessor headerAccessor) {
        
        // Save message to database
        ChatMessageDto savedMessage = chatService.saveMessage(message.toDto());
        
        // Send to specific user (if receiverId provided)
        if (message.getReceiverId() != null) {
            messagingTemplate.convertAndSendToUser(
                message.getReceiverId().toString(),
                "/queue/private-messages",
                savedMessage
            );
        }
        
        // 🆕 Send admin notification for all conversation updates
        notificationService.notifyAdminsOfConversationUpdate(savedMessage);
        
        // 🆕 Send specific conversation update
        notificationService.notifyConversationSubscribers(savedMessage);
        
        log.info("Private message saved with ID: {}", savedMessage.getId());
    }

    // 🆕 Handle typing indicators
    @MessageMapping("/chat.typing")
    public void handleTypingIndicator(
            @Payload TypingIndicator indicator,
            SimpMessageHeaderAccessor headerAccessor) {
        
        // Broadcast typing status to conversation subscribers
        ConversationUpdate update = ConversationUpdate.builder()
                .action(indicator.isTyping() ? "typing_start" : "typing_stop")
                .userId(indicator.getConversationUserId())
                .actorId(indicator.getUserId())
                .actorUsername(indicator.getUsername())
                .timestamp(LocalDateTime.now())
                .build();
        
        messagingTemplate.convertAndSend(
            "/topic/conversation/" + indicator.getConversationUserId(),
            update
        );
    }

    // 🆕 Handle user status updates
    @MessageMapping("/chat.status")
    public void handleUserStatus(
            @Payload UserStatusUpdate status,
            SimpMessageHeaderAccessor headerAccessor) {
        
        // Broadcast status to all admins
        messagingTemplate.convertAndSend("/topic/admin-notifications", status);
    }
}
```

### 3. NotificationService Implementation

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;

    public void notifyAdminsOfConversationUpdate(ChatMessageDto message) {
        try {
            // Get sender info
            User sender = userRepository.findById(message.getSenderId()).orElse(null);
            String senderUsername = sender != null ? sender.getUsername() : "Unknown";
            
            // Create admin notification
            AdminNotification notification = AdminNotification.builder()
                    .type("conversation_update")
                    .conversationUserId(message.getSenderId())
                    .messageId(message.getId())
                    .senderId(message.getSenderId())
                    .senderUsername(senderUsername)
                    .messagePreview(truncateMessage(message.getMessage()))
                    .timestamp(LocalDateTime.now())
                    .build();

            // Broadcast to all admins/managers
            messagingTemplate.convertAndSend("/topic/admin-notifications", notification);
            
            log.info("Admin notification sent for conversation with user: {}", message.getSenderId());
            
        } catch (Exception e) {
            log.error("Failed to send admin notification", e);
        }
    }

    public void notifyConversationSubscribers(ChatMessageDto message) {
        try {
            // Determine which user's conversation this belongs to
            UUID conversationUserId = "user".equals(message.getSenderType()) 
                ? message.getSenderId() 
                : message.getReceiverId();

            if (conversationUserId != null) {
                User actor = userRepository.findById(message.getSenderId()).orElse(null);
                String actorUsername = actor != null ? actor.getUsername() : "Unknown";
                
                ConversationUpdate update = ConversationUpdate.builder()
                        .action("new_message")
                        .userId(conversationUserId)
                        .message(message)
                        .actorId(message.getSenderId())
                        .actorUsername(actorUsername)
                        .timestamp(LocalDateTime.now())
                        .build();

                // Send to specific conversation channel
                messagingTemplate.convertAndSend(
                    "/topic/conversation/" + conversationUserId,
                    update
                );
                
                log.info("Conversation update sent for user: {}", conversationUserId);
            }
            
        } catch (Exception e) {
            log.error("Failed to send conversation update", e);
        }
    }

    private String truncateMessage(String message) {
        if (message == null) return "";
        return message.length() > 50 ? message.substring(0, 47) + "..." : message;
    }
}
```

### 4. Subscription Management REST Controller

```java
@RestController
@RequestMapping("/api/chat/subscriptions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('admin') or hasRole('manager')")
public class SubscriptionController {

    @PostMapping("/conversation/{userId}")
    public ApiResponse<String> subscribeToConversation(@PathVariable UUID userId) {
        // This endpoint is mainly for documentation
        // Actual subscription happens on frontend via STOMP
        return ApiResponse.<String>builder()
                .result("Subscribe to: /topic/conversation/" + userId)
                .build();
    }

    @PostMapping("/admin-notifications")
    public ApiResponse<String> subscribeToAdminNotifications() {
        return ApiResponse.<String>builder()
                .result("Subscribe to: /topic/admin-notifications")
                .build();
    }
}
```

### 6. Database Entity
```java
@Entity
@Table(name = "chat_messages")
public class ChatMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "sender_id", nullable = false)
    private String senderId;
    
    @Column(name = "receiver_id")
    private String receiverId; // null for public messages
    
    @Column(name = "message", columnDefinition = "TEXT")
    private String message;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "sender_type")
    private SenderType senderType;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    // Getters, setters, constructors
    
    public enum SenderType {
        ADMIN, USER, CHATBOT
    }
}
```

### 7. Repository
```java
@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    
    @Query("SELECT m FROM ChatMessage m WHERE " +
           "(m.senderId = :user1Id AND m.receiverId = :user2Id) OR " +
           "(m.senderId = :user2Id AND m.receiverId = :user1Id) " +
           "ORDER BY m.createdAt ASC")
    List<ChatMessage> findMessagesBetweenUsers(
        @Param("user1Id") String user1Id, 
        @Param("user2Id") String user2Id
    );
    
    List<ChatMessage> findByReceiverIdIsNullOrderByCreatedAtDesc();
    
    List<ChatMessage> findBySenderIdOrderByCreatedAtDesc(String senderId);
    
    List<ChatMessage> findByReceiverIdOrderByCreatedAtDesc(String receiverId);
}
```

### 8. Security Configuration
```java
@Configuration
@EnableWebSocketSecurity
public class WebSocketSecurityConfig {
    
    @Bean
    public AuthorizationManager<Message<?>> messageAuthorizationManager(
            MessageMatcherDslCustomizer messages) {
        return messages
            .simpDestMatchers("/app/**").authenticated()
            .simpSubscribeDestMatchers("/topic/**", "/queue/**", "/user/**").authenticated()
            .anyMessage().denyAll()
            .build();
    }
}
```

### 9. REST API cho Chat History
```java
@RestController
@RequestMapping("/api/chat")
public class ChatRestController {
    
    @Autowired
    private ChatService chatService;
    
    // Get conversation between two users (for admin)
    @GetMapping("/conversation/{user1Id}/{user2Id}")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<List<ChatMessageDto>> getConversation(
            @PathVariable String user1Id,
            @PathVariable String user2Id) {
        
        List<ChatMessageDto> messages = chatService.getMessagesBetweenUsers(user1Id, user2Id);
        return ResponseEntity.ok(messages);
    }
    
    // Get public messages
    @GetMapping("/public")
    public ResponseEntity<List<ChatMessageDto>> getPublicMessages() {
        List<ChatMessageDto> messages = chatService.getPublicMessages();
        return ResponseEntity.ok(messages);
    }
    
    // Get user's chat history
    @GetMapping("/history")
    public ResponseEntity<List<ChatMessageDto>> getUserChatHistory(Principal principal) {
        String userId = principal.getName(); // or get from JWT
        List<ChatMessageDto> messages = chatService.getUserMessages(userId);
        return ResponseEntity.ok(messages);
    }
}
```

### 10. Frontend Connection Status
Frontend đã cấu hình để:
- ✅ Kết nối đến `ws://localhost:8080/ws`
- ✅ Sử dụng SockJS client
- ✅ Subscribe đúng các topics theo role
- ✅ Gửi messages với format đúng
- ✅ Hiển thị trạng thái kết nối
- ✅ Handle authentication với JWT token

### 11. Testing WebSocket

**Test với Browser Console:**
```javascript
// Test kết nối
console.log('WebSocket connected:', isConnected)

// Test gửi tin nhắn
sendPrivateMessage('user-id', 'Hello!')
sendPublicMessage('Hello everyone!')
```

**Backend Console Logs:**
```
STOMP: Connected to ws://localhost:8080/ws
STOMP: >>> SUBSCRIBE destination=/topic/messages
STOMP: >>> SUBSCRIBE destination=/user/queue/private-messages
STOMP: >>> SUBSCRIBE destination=/topic/admin-messages
```

### 12. Troubleshooting

**Common Issues:**
1. **CORS**: Ensure `setAllowedOriginPatterns("*")` in WebSocketConfig
2. **Authentication**: Check JWT token in connect headers
3. **SockJS**: Use `new SockJS()` instead of native WebSocket
4. **User destinations**: Ensure user ID matches between frontend and backend

**Debug Steps:**
1. Check browser console for STOMP logs
2. Verify WebSocket endpoint is accessible
3. Test with simple message first
4. Check database for saved messages
5. Verify user roles and permissions

## 🎯 Frontend Implementation Guide

### 1. Dynamic Subscription Pattern

```typescript
class AdminChatManager {
    private stompClient: any;
    private currentConversationSubscription: any;
    private adminNotificationSubscription: any;

    // Subscribe to admin notifications (always active for admin users)
    subscribeToAdminNotifications() {
        this.adminNotificationSubscription = this.stompClient.subscribe(
            '/topic/admin-notifications',
            (notification: any) => {
                const data: AdminNotification = JSON.parse(notification.body);
                this.handleAdminNotification(data);
            }
        );
    }

    // Subscribe to specific conversation (when admin selects a user)
    subscribeToConversation(userId: string) {
        // Unsubscribe from previous conversation
        this.unsubscribeFromCurrentConversation();
        
        // Subscribe to new conversation
        this.currentConversationSubscription = this.stompClient.subscribe(
            `/topic/conversation/${userId}`,
            (update: any) => {
                const data: ConversationUpdate = JSON.parse(update.body);
                this.handleConversationUpdate(data);
            }
        );
        
        console.log(`Subscribed to conversation: ${userId}`);
    }

    // Clean unsubscribe when switching users or leaving
    unsubscribeFromCurrentConversation() {
        if (this.currentConversationSubscription) {
            this.currentConversationSubscription.unsubscribe();
            this.currentConversationSubscription = null;
        }
    }

    // Handle different types of admin notifications
    private handleAdminNotification(notification: AdminNotification) {
        switch (notification.type) {
            case 'conversation_update':
                this.showNotificationBadge(notification.conversationUserId);
                this.updateConversationList();
                break;
            case 'new_user_message':
                this.playNotificationSound();
                this.showToast(`New message from ${notification.senderUsername}`);
                break;
        }
    }

    // Handle conversation-specific updates
    private handleConversationUpdate(update: ConversationUpdate) {
        switch (update.action) {
            case 'new_message':
                this.addMessageToCurrentConversation(update.message);
                break;
            case 'typing_start':
                this.showTypingIndicator(update.actorUsername);
                break;
            case 'typing_stop':
                this.hideTypingIndicator(update.actorId);
                break;
        }
    }
}
```

### 2. React Hook Example

```typescript
export function useAdminChat() {
    const [stompClient, setStompClient] = useState<any>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);

    useEffect(() => {
        // Initialize STOMP connection
        const socket = new SockJS('/ws');
        const client = Stomp.over(socket);
        
        client.connect({}, () => {
            setStompClient(client);
            
            // Always subscribe to admin notifications
            client.subscribe('/topic/admin-notifications', (notification: any) => {
                const data: AdminNotification = JSON.parse(notification.body);
                setNotifications(prev => [data, ...prev]);
            });
        });

        return () => {
            if (client) client.disconnect();
        };
    }, []);

    const subscribeToUser = useCallback((userId: string) => {
        if (currentUserId) {
            // Unsubscribe from previous user
            // This happens automatically when component unmounts or userId changes
        }
        
        setCurrentUserId(userId);
        
        if (stompClient) {
            stompClient.subscribe(`/topic/conversation/${userId}`, (update: any) => {
                const data: ConversationUpdate = JSON.parse(update.body);
                // Handle conversation update...
            });
        }
    }, [stompClient, currentUserId]);

    return {
        subscribeToUser,
        notifications,
        currentUserId
    };
}
```

### 3. Complete Integration Example

```typescript
// Admin Chat Component
export function AdminChatPanel() {
    const { subscribeToUser, notifications } = useAdminChat();
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);

    // When admin selects a user
    const handleUserSelect = (userId: string) => {
        setSelectedUserId(userId);
        subscribeToUser(userId); // Dynamic subscription
    };

    // Auto-refresh conversation list when notifications arrive
    useEffect(() => {
        if (notifications.length > 0) {
            const latestNotification = notifications[0];
            if (latestNotification.type === 'conversation_update') {
                // Refresh conversation list or update specific conversation
                refreshConversationList();
            }
        }
    }, [notifications]);

    return (
        <div className="admin-chat-panel">
            <ConversationList 
                conversations={conversations}
                onUserSelect={handleUserSelect}
                selectedUserId={selectedUserId}
            />
            <ChatView 
                userId={selectedUserId}
                notifications={notifications}
            />
        </div>
    );
}
```

## 📋 Channel Summary

| Channel | Purpose | Subscription | Payload |
|---------|---------|-------------|---------|
| `/topic/admin-notifications` | Notify all admins of any conversation activity | Always active for admin users | `AdminNotification` |
| `/topic/conversation/{userId}` | Real-time updates for specific user conversation | Dynamic - when admin selects user | `ConversationUpdate` |
| `/topic/messages` | Public chat messages (existing) | Optional - for public chat | `ChatMessageDto` |
| `/queue/private-messages` | Direct private messages (existing) | User-specific | `ChatMessageDto` |

## 🔧 Testing the Implementation

### Backend Testing
```bash
# Start the application
./mvnw spring-boot:run

# Test WebSocket endpoints using tools like Postman or WebSocket clients
# Connect to: ws://localhost:8080/ws
```

### Frontend Testing
```javascript
// Test admin notification subscription
stompClient.subscribe('/topic/admin-notifications', console.log);

// Test conversation subscription  
stompClient.subscribe('/topic/conversation/USER_ID_HERE', console.log);

// Send test message to trigger notifications
stompClient.send('/app/chat.sendPrivateMessage', {}, JSON.stringify({
    message: 'Test message',
    senderType: 'user',
    senderId: 'USER_ID',
    receiverId: null
}));
```

Với hệ thống notification mới này, frontend sẽ có khả năng real-time sync hoàn toàn! 🚀