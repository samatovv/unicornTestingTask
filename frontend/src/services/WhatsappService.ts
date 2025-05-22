// src/services/whatsappService.ts

export interface MessagePayload {
    phone: string;
    message: string;
  }
  
  export interface SendMessagesResponse {
    count: number;
    // добавь другие поля ответа, если нужно
  }
  
  export const sendMessages = async (
    messages: MessagePayload[]
  ): Promise<SendMessagesResponse> => {
    const res = await fetch("http://ec2-51-21-3-88.eu-north-1.compute.amazonaws.com:8090/send-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
  
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || res.statusText);
    }
  
    return res.json();
  };
  