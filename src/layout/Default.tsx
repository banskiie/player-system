import { Box, Container } from "@mui/material"
import { Outlet } from "react-router-dom"
import Header from "../components/ui/Header"
import Sidebar from "../components/ui/Sidebar"
import Notification from "../components/ui/Notification"

export default () => {
  return (
    <Container
      maxWidth={false}
      sx={{
        height: "100vh",
        display: "flex",
        bgcolor: "background.default",
      }}
      disableGutters
    >
      <Notification />
      <Box sx={{ width: "20%", bgcolor: "white", height: "100%" }}>
        <Sidebar />
      </Box>
      <Box
        sx={{
          width: "80%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box sx={{ height: 50 }}>
          <Header />
        </Box>
        <Box sx={{ height: "calc(100% - 50px)" }}>
          <Outlet />
        </Box>
      </Box>
    </Container>
  )
}
