import React, { useState } from "react";
import { Box, Button, TextField, Stack } from "@mui/material";

type AddClientFormProps = {
  addClient: (name: string, phone: string) => void;
};

const AddClientForm: React.FC<AddClientFormProps> = ({ addClient }) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const handleAdd = () => {
    if (!name.trim() || !phone.trim()) {
      alert("Введите имя и телефон");
      return;
    }
    addClient(name.trim(), phone.trim());
    setName("");
    setPhone("");
  };

  return (
    <Box mb={3}>
      <Stack direction="row" spacing={2}>
        <TextField
          label="Имя"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
        />
        <TextField
          label="Телефон"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          fullWidth
        />
        <Button sx={{ px: 5 }} variant="contained" onClick={handleAdd}>
          Добавить
        </Button>
      </Stack>
    </Box>
  );
};

export default AddClientForm;
