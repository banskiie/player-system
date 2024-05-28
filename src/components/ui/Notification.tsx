import { Alert, Snackbar } from "@mui/material"
import { useNotifStore } from "../../store/notif"

export default () => {
  const { show, message, severity, close } = useNotifStore((state) => state)

  return (
    <Snackbar open={show} autoHideDuration={3000} onClose={close}>
      <Alert
        severity={severity}
        variant="standard"
        sx={{ width: "100%" }}
        onClose={close}
      >
        {message}
      </Alert>
    </Snackbar>
  )
}
