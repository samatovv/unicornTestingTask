export interface MessagePayload {
    phone: string;
    message: string;
  }
  
  export interface SendMessagesResponse {
    count: number;
  }
  
  export const sendMessages = async (
    companyId: string,
    messages: MessagePayload[]
  ): Promise<SendMessagesResponse> => {
    const res = await fetch(`http://localhost:8080/api/${companyId}/send-message`, {
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
  
  