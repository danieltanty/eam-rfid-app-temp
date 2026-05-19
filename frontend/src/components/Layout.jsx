import { Outlet, useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Box,
  Divider,
  ListItemIcon,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useState } from "react";
import { useAuthStore } from "../store";
import Logo from '../assets/logo_banner.png';

import { 
  Inventory as InventoryIcon, 
  CalendarToday as PmSchedulesIcon, 
  Checklist as ChecklistIcon, 
  Build as PerformInventoryIcon, 
  Summarize as InventorySummaryIcon, 
  ExitToApp as LogoutIcon ,
  Person as PersonIcon,
  Radar as RadarIcon
} from "@mui/icons-material";

export default function Layout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [open, setOpen] = useState(false);

  const menuItems = [
    { text: "Assets", path: "/inventory", icon: <InventoryIcon /> },
    { text: "Nearby Assets", path: "/assets/nearby", icon: <RadarIcon /> },
    { text: "Work Orders", path: "/work-orders", icon: <ChecklistIcon /> },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar style={{ backgroundColor: "#003c74", padding: 0 }}>
          <IconButton color="inherit" onClick={() => setOpen(true)} sx={{ padding: '8px' }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: "bold", flexGrow: 0, pl: 1.5 }}>
            HxGN EAM
          </Typography>
          <Typography variant="body2" sx={{ flexGrow: 1, pl: 1.5 }}>
            (YNY Technology)
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer open={open} onClose={() => setOpen(false)}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "80vw",
            height: "100%",
            color: "#e7e7e7",
            backgroundColor: "#003c74",
            padding: 2,
            boxSizing: "border-box",
          }}
        >
          <List sx={{ paddingBottom: 2 }}>
            {menuItems.map((item, index) => (
              <ListItemButton
                key={index}
                onClick={() => {
                  navigate(item.path);
                  setOpen(false);
                }}
                sx={{
                  padding: '12px 16px',
                  '&:hover': {
                    backgroundColor: "#004b8f",
                  },
                }}
              >
                <ListItemIcon sx={{ color: "#e7e7e7" }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} sx={{ fontWeight: 500 }} />
              </ListItemButton>
            ))}
          </List>

          <Divider sx={{ backgroundColor: '#e7e7e7', marginBottom: 2 }} />

          <List>
            <ListItemButton
              // TODO: onClick={}
              sx={{
                padding: '12px 16px',
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: "#004b8f",
                },
              }}
            >
              <ListItemIcon sx={{ color: "#e7e7e7" }}>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText primary={user?.username} sx={{ fontWeight: 500 }} />
            </ListItemButton>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                padding: '12px 16px',
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: "#004b8f",
                },
              }}
            >
              <ListItemIcon sx={{ color: "#e7e7e7" }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" sx={{ fontWeight: 600 }} />
            </ListItemButton>
          </List>

          <Box sx={{ mt: 2, textAlign: "center" }}>
            <img
              src={Logo}
              alt="Logo"
              style={{
                width: "100%",
                maxWidth: "180px",
                objectFit: "contain",
                margin: "auto",
              }}
            />
          </Box>
        </Box>
      </Drawer>

      <Box p={1} sx={{ pt: 2 }}>
        <Outlet />
      </Box>
    </>
  );
}