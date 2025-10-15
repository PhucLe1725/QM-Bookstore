package com.qm.bookstore.qm_bookstore.mapper;

import com.qm.bookstore.qm_bookstore.dto.chat.ChatMessageDto;
import com.qm.bookstore.qm_bookstore.entity.ChatMessage;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(componentModel = "spring")
public interface ChatMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "sender", ignore = true)
    @Mapping(target = "receiver", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(source = "senderType", target = "senderType", qualifiedByName = "stringToSenderType")
    ChatMessage toEntity(ChatMessageDto dto);

    @Mapping(source = "senderType", target = "senderType", qualifiedByName = "senderTypeToString")
    @Mapping(source = "sender.username", target = "senderUsername")
    @Mapping(source = "receiver.username", target = "receiverUsername")
    ChatMessageDto toDto(ChatMessage entity);

    @Named("stringToSenderType")
    default ChatMessage.SenderType stringToSenderType(String senderType) {
        if (senderType == null) return null;
        return ChatMessage.SenderType.valueOf(senderType.toLowerCase());
    }

    @Named("senderTypeToString")
    default String senderTypeToString(ChatMessage.SenderType senderType) {
        if (senderType == null) return null;
        return senderType.name().toLowerCase();
    }
}