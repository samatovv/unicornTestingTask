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
    const res = await fetch(`http://ec2-16-171-39-119.eu-north-1.compute.amazonaws.com:3000/api/${companyId}/send-message`, {
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
  
  