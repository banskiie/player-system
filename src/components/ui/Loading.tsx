import { Box, CircularProgress, Container } from "@mui/material"
import Lottie from "lottie-react"
import badminton from "../../assets/lotties/badminton.json"

export const PageLoader = () => {
  return (
    <Container
      maxWidth={false}
      sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <CircularProgress size={150} thickness={5} color="secondary" />
    </Container>
  )
}
