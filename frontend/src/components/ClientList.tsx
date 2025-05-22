import React from "react";
import { Checkbox, FormControlLabel, List, ListItem } from "@mui/material";
import type { Client } from "../types";

type ClientListProps = {
  clients: Client[];
  toggleClient: (id: number) => void;
};

const ClientList: React.FC<ClientListProps> = ({ clients, toggleClient }) => {
  return (
    <List sx={{ maxHeight: 200, overflowY: "auto", mb: 3 }}>
      {clients.map((client) => (
        <ListItem key={client.id} disablePadding>
          <FormControlLabel
            control={
              <Checkbox
                checked={client.selected}
                onChange={() => toggleClient(client.id)}
              />
            }
            label={`${client.name} — ${client.phone}`}
          />
        </ListItem>
      ))}
    </List>
  );
};

export default ClientList;
