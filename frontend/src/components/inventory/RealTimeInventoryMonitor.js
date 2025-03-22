import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Badge,
  IconButton,
  Collapse,
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
} from "@mui/icons-material";
import { InventoryContext } from "../../pages/inventory/Dashboard";

const RealTimeInventoryMonitor = () => {
  const { products } = useContext(InventoryContext);
  const [inventoryUpdates, setInventoryUpdates] = useState([]);
  const [expanded, setExpanded] = useState(true);

  // Listen for real inventory updates rather than generating random ones
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "inventoryUpdate") {
        const updateData = JSON.parse(e.newValue);
        const product = products.find((p) => p.id === updateData.id);

        if (product) {
          const newUpdate = {
            id: Date.now(),
            productId: product.id,
            productName: product.name,
            quantity: updateData.quantity,
            timestamp: new Date(),
            type: "sale",
          };

          setInventoryUpdates((prev) => {
            const updated = [newUpdate, ...prev];
            // Keep only the latest 10 updates
            return updated.slice(0, 10);
          });
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [products]);

  // Format time for display
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
      <Box
        sx={{
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "primary.light",
          borderBottom: "1px solid",
          borderColor: "primary.main",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Badge
            badgeContent={inventoryUpdates.length}
            color="error"
            sx={{ mr: 1 }}
          >
            <NotificationsIcon color="primary" />
          </Badge>
          <Typography variant="h6" color="primary.dark">
            Real-Time Inventory Updates
          </Typography>
        </Box>

        <IconButton onClick={toggleExpanded} size="small">
          {expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <List sx={{ py: 0, maxHeight: "300px", overflow: "auto" }}>
          {inventoryUpdates.length === 0 ? (
            <ListItem>
              <ListItemText
                primary="No recent inventory updates"
                secondary="Real-time updates will appear here"
              />
            </ListItem>
          ) : (
            inventoryUpdates.map((update, index) => (
              <React.Fragment key={update.id}>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center">
                        <Typography variant="body1" fontWeight={500}>
                          {update.productName}
                        </Typography>
                        <Chip
                          label={`-${update.quantity}`}
                          color="primary"
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        {update.type === "sale"
                          ? "Sale completed"
                          : "Stock updated"}{" "}
                        at {formatTime(update.timestamp)}
                      </Typography>
                    }
                  />
                </ListItem>
                {index < inventoryUpdates.length - 1 && <Divider />}
              </React.Fragment>
            ))
          )}
        </List>
      </Collapse>
    </Paper>
  );
};

export default RealTimeInventoryMonitor;
