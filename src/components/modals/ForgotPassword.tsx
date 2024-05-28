import Typography from "@mui/material/Typography"
import {
  DialogTitle,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material"

type DialogProps = {
  open: boolean
  onClose: () => void
}

export default ({ open, onClose }: DialogProps) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Forgot Password?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Please contact <b>nats@c-one.ph</b> to reset your password.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button color="error" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
