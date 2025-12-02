import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Badge
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  School,
  Assignment,
  Verified,
  Logout,
  Person,
  Notifications
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';

const drawerWidth = 240;

const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotifOpen = (event) => {
    setNotifAnchorEl(event.currentTarget);
  };

  const handleNotifClose = () => {
    setNotifAnchorEl(null);
  };

  const loadNotifications = async () => {
    try {
      const res = await notificationService.list();
      const items = res.data || [];
      setNotifications(items);
      setUnreadCount(items.filter((n) => !n.read).length);
    } catch (e) {
      console.error('Failed to load notifications', e);
    }
  };

  useEffect(() => {
    if (authService.isAuthenticated()) {
      loadNotifications();
      const id = setInterval(loadNotifications, 30000);
      return () => clearInterval(id);
    }
  }, []);

  const handleNotificationClick = async (notificationId) => {
    try {
      await notificationService.markRead(notificationId);
      await loadNotifications();
    } catch (e) {
      console.error('Failed to mark notification as read', e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      await loadNotifications();
    } catch (e) {
      console.error('Failed to mark all notifications as read', e);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const getMenuItems = () => {
    const path = location.pathname;
    if (path.startsWith('/student')) {
      return [
        { text: 'Dashboard', icon: <Dashboard />, path: '/student' },
        { text: 'Profile', icon: <Person />, path: '/student/profile' },
        { text: 'Transcripts', icon: <Assignment />, path: '/student/transcripts' },
        { text: 'Certificates', icon: <Verified />, path: '/student/certificates' }
      ];
    } else if (path.startsWith('/faculty')) {
      return [
        { text: 'Dashboard', icon: <Dashboard />, path: '/faculty' },
        { text: 'Profile', icon: <Person />, path: '/faculty/profile' },
        { text: 'Upload Grades', icon: <School />, path: '/faculty/grades' },
        { text: 'Courses', icon: <Assignment />, path: '/faculty/courses' }
      ];
    } else if (path.startsWith('/admin')) {
      return [
        { text: 'Dashboard', icon: <Dashboard />, path: '/admin' },
        { text: 'Issue Certificate', icon: <Verified />, path: '/admin/certificates' },
        { text: 'Issue Transcript', icon: <Assignment />, path: '/admin/transcripts' },
        { text: 'Audit Logs', icon: <School />, path: '/admin/audit' }
      ];
    }
    return [];
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` }
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            University Blockchain System
          </Typography>
          <IconButton color="inherit" onClick={handleNotifOpen} sx={{ mr: 1 }}>
            <Badge color="error" badgeContent={unreadCount} max={9}>
              <Notifications />
            </Badge>
          </IconButton>
          <IconButton onClick={handleMenuOpen}>
            <Avatar sx={{ width: 32, height: 32 }}>U</Avatar>
          </IconButton>
          <Menu
            anchorEl={notifAnchorEl}
            open={Boolean(notifAnchorEl)}
            onClose={handleNotifClose}
          >
            <MenuItem disabled sx={{ fontWeight: 'bold' }}>
              Notifications
            </MenuItem>
            {notifications.length === 0 && (
              <MenuItem disabled>No notifications</MenuItem>
            )}
            {notifications.map((n) => (
              <MenuItem
                key={n._id}
                onClick={() => handleNotificationClick(n._id)}
                selected={!n.read}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: n.read ? 'normal' : 'bold' }}
                  >
                    {n.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {n.message}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
            {notifications.length > 0 && (
              <>
                <Divider />
                <MenuItem onClick={handleMarkAllRead}>Mark all as read</MenuItem>
              </>
            )}
          </Menu>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => navigate('/profile')}>
              <ListItemIcon><Person fontSize="small" /></ListItemIcon>
              Profile
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
        >
          <List>
            {getMenuItems().map((item) => (
              <ListItem
                key={item.text}
                button
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                selected={location.pathname === item.path}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
          open
        >
          <Toolbar />
          <List>
            {getMenuItems().map((item) => (
              <ListItem
                key={item.text}
                button
                onClick={() => navigate(item.path)}
                selected={location.pathname === item.path}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` }
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default Layout;


