import { useAuthStore } from "../../store/auth"
import { Box, IconButton, ListItemIcon, Menu, MenuItem } from "@mui/material"
import {
  LogoutRounded as Exit,
  AccountCircle,
  Password
} from "@mui/icons-material"
import { useState } from "react"
import ChangePassword from "../modals/ChangePassword"

export default () => {
  const { logout } = useAuthStore((state) => state)
  const [anchor, setAnchor] = useState<any>(null)
  const open = Boolean(anchor)
  const [openChangePassword, setOpenChangePassword] = useState<boolean>(false)

  const handleOpen = (event: any) => {
    setAnchor(event.currentTarget)
  }

  const handleClose = () => {
    setAnchor(null)
  }

  return (
    <>
      <ChangePassword open={openChangePassword} onClose={() => setOpenChangePassword(false)} />
      <Menu anchorEl={anchor} open={open} onClose={handleClose}>
        <MenuItem onClick={() => setOpenChangePassword(true)}>
          <ListItemIcon>
            <Password fontSize="small" />
          </ListItemIcon>
          Change Password
        </MenuItem>
        <MenuItem onClick={logout} disableRipple>
          <ListItemIcon>
            <Exit fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          height: "100%",
          px: 1,
          gap: 0.25,
        }}
      >
        <IconButton onClick={handleOpen}>
          <AccountCircle fontSize="large" />
        </IconButton>
      </Box>
    </>
  )
}
