import React, { useState } from "react";
import {
  Box,
  Container,
  LinearProgress,
  MenuItem,
  Select,
  type SelectChangeEvent,
  TextField,
  Typography,
  FormControl,
  InputLabel,
} from "@mui/material";

import ClientList from "./components/ClientList";
import MessageForm from "./components/MessageForm";
import AddClientForm from "./components/AddClientForm";
import type { Client } from "./types";
import { sendMessages, type MessagePayload } from "./services/WhatsappService";
import { templates } from "./utils";

const App: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([
    { id: 1, name: "Абдурахман", phone: "996708684068", selected: false },
  ]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [delay, setDelay] = useState(500);

  const toggleClient = (id: number) => {
    setClients((prev) =>
      prev.map((client) =>
        client.id === id ? { ...client, selected: !client.selected } : client
      )
    );
  };

  const addClient = (name: string, phone: string) => {
    setClients((prev) => [
      ...prev,
      {
        id: prev.length ? prev[prev.length - 1].id + 1 : 1,
        name,
        phone,
        selected: false,
      },
    ]);
  };

  const handleSend = async () => {
    const selected = clients.filter((c) => c.selected);
    if (selected.length === 0 || !message) {
      alert("Выберите клиентов и введите сообщение");
      return;
    }

    setSending(true);
    setProgress(0);

    const messages: MessagePayload[] = selected.map((client) => ({
      phone: client.phone,
      message,
    }));

    try {
      const data = await sendMessages(messages);
      alert(`Отправлено в очередь: ${data.count} сообщений`);
      setProgress(100);
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(`Ошибка сервера: ${error.message || "Неизвестная ошибка"}`);
      } else {
        alert("Неизвестная ошибка");
      }
    } finally {
      setSending(false);
    }
  };

  const handleTemplateChange = (e: SelectChangeEvent) => {
    setMessage(e.target.value);
  };

  return (
    <Container maxWidth="sm" sx={{ pt: 4 }}>
      <Typography variant="h4" fontWeight="bold" mb={3} color="primary">
        Массовая рассылка WhatsApp
      </Typography>

      <AddClientForm addClient={addClient} />

      <ClientList clients={clients} toggleClient={toggleClient} />

      <Box mt={2} mb={2}>
        <TextField
          label="Пауза между сообщениями (мс)"
          type="number"
          fullWidth
          value={delay}
          onChange={(e) => setDelay(Number(e.target.value))}
          disabled={sending}
        />

        <FormControl fullWidth sx={{ mb: 2, mt: 2 }}>
          <InputLabel id="template-label">Шаблоны сообщений</InputLabel>
          <Select
            labelId="template-label"
            value={message}
            label="Шаблоны сообщений"
            onChange={handleTemplateChange}
            disabled={sending}
          >
            {templates.map((t, i) => (
              <MenuItem key={i} value={t}>
                {t}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <MessageForm
        message={message}
        setMessage={setMessage}
        handleSend={handleSend}
        disabled={sending}
      />

      {sending && (
        <Box mt={2}>
          <LinearProgress variant="determinate" value={progress} />
          <Typography variant="body2" mt={1} textAlign="center">
            Отправлено: {progress}%
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default App;
