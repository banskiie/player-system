import {
  Avatar,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material"
import {
  Dashboard as Dashboard,
  Group as Players,
  SportsScore as Clubs,
  EmojiEvents as Tournaments,
  History,
} from "@mui/icons-material"
import Default from "../../assets/images/default.png"
import { useAuthStore } from "../../store/auth"
import { NavLink } from "react-router-dom"
import styles from "../../styles/sidebar.module.css"

const items = [
  {
    label: "Dashboard",
    icon: <Dashboard fontSize="small" />,
    to: "/",
  },
  {
    label: "Players",
    icon: <Players fontSize="small" />,
    to: "/players",
  },
  {
    label: "Clubs",
    icon: <Clubs fontSize="small" />,
    to: "/clubs",
  },
  {
    label: "Tournaments",
    icon: <Tournaments fontSize="small" />,
    to: "/tournaments",
  },
  {
    label: "History",
    icon: <History fontSize="small" />,
    to: "/history",
  },
]

export default () => {
  const { user } = useAuthStore((state) => state)

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Sidebar Header */}
      <Box
        sx={{
          py: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Avatar
          src={Default}
          sx={{
            width: 120,
            height: 120,
            border: "solid 3px",
            borderColor: "GrayText",
          }}
        />
        <Stack>
          {!!user?.providerData[0].displayName && (
            <Typography textAlign="center" fontWeight="bold">
              {user?.providerData[0].displayName}
            </Typography>
          )}
          {!!user?.providerData[0].email && (
            <Typography textAlign="center" variant="body2">
              {user?.providerData[0].email}
            </Typography>
          )}
        </Stack>
      </Box>
      {/* Sidebar Menu */}
      <Box sx={{ width: "95%" }}>
        <List disablePadding>
          {items.map((item: any, index: number) => (
            <ListItem key={index} disablePadding>
              <ListItemButton
                className={styles.item}
                component={NavLink}
                to={item.to}
              >
                <ListItemIcon sx={{ mr: -2.5 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  )
}
