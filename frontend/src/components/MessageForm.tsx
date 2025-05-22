import React from "react";
import { Box, Button, TextField } from "@mui/material";

type MessageFormProps = {
  message: string;
  setMessage: (value: string) => void;
  handleSend: () => void;
  disabled?: boolean;
};

const MessageForm: React.FC<MessageFormProps> = ({
  message,
  setMessage,
  handleSend,
  disabled = false,
}) => {
  return (
    <Box>
      <TextField
        label="Сообщение"
        multiline
        rows={4}
        fullWidth
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={disabled}
      />
      <Button
        variant="contained"
        color="success"
        onClick={handleSend}
        sx={{ mt: 2, width: "100%" }}
        disabled={disabled}
      >
        Отправить
      </Button>
    </Box>
  );
};

export default MessageForm;
