import {
    DialogTitle,
    Dialog,
    DialogContent,
    DialogActions,
    Button,
    Stack,
    TextField,
    FormControl,
    FormLabel, Typography,
    FormHelperText,
    IconButton,
    InputAdornment,
} from "@mui/material"
import {
    VisibilityRounded as Show,
    VisibilityOffRounded as Hide,
} from "@mui/icons-material"
import { AuthCredential, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth"
import { useAuthStore } from "../../store/auth"
import { LoadingButton } from "@mui/lab"
import { useState } from "react"

type DialogProps = {
    open: boolean
    onClose: () => void
}

export default ({ open, onClose }: DialogProps) => {
    const { user } = useAuthStore(state => state)
    const [reauthenticated, setReauthenticated] = useState<boolean>(false)
    const [email, setEmail] = useState<string>("")
    const [password, setPassword] = useState<string>("")
    const [newPassword, setNewPassword] = useState<string>("")
    const [retypedPassword, setRetypedPassword] = useState<string>("")
    // Form Settings
    const [secure, setSecure] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<boolean>(false)

    const reauthenticate = async () => {
        try {
            setLoading(true)
            setError(false)
            if (user) {
                const credential = EmailAuthProvider.credential(email, password)
                await reauthenticateWithCredential(user, credential)
                setReauthenticated(true)
                setSecure(true)
            }
        } catch (error: any) {
            setPassword("")
            setReauthenticated(false)
            setError(true)
        } finally {
            setLoading(false)
        }
    }

    const change = async () => {
        if (newPassword !== retypedPassword) {
            setError(true)
            return
        }
        try {
            setLoading(true)
            setError(false)
            if (user) {
                await updatePassword(user, newPassword)
                onClose()
            }
        } catch (error: any) {
            setError(true)
        } finally {
            setLoading(false)
        }
    }

    const close = () => {
        onClose()
        setTimeout(() => {
            setError(false)
            setEmail("")
            setPassword("")
            setNewPassword("")
            setRetypedPassword("")
            setSecure(true)
        }, 175)
    }


    return (
        <Dialog
            open={open}
            onClose={close}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>
                {!reauthenticated ?
                    <>
                        Verify Credentials
                        <Typography variant="body2" component="div" color="GrayText">
                            Please enter credentials to verify your account.
                        </Typography>
                    </>
                    :
                    <>
                        Change Password
                        <Typography variant="body2" component="div" color="GrayText">
                            Please enter your new password.
                        </Typography>
                    </>
                }

            </DialogTitle>
            <DialogContent>
                <Stack sx={{ gap: 1 }}>
                    {!reauthenticated ?
                        <>
                            <FormControl error={error} sx={{ gap: 0.5 }}>
                                <FormLabel>Email</FormLabel>
                                <TextField
                                    id="email"
                                    label=""
                                    type="email"
                                    variant="outlined"
                                    size="small"
                                    color="primary"
                                    margin="none"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    error={error}
                                // onKeyDown={enter}
                                />
                            </FormControl>
                            <FormControl error={error} sx={{ gap: 0.5 }}>
                                <FormLabel>Password</FormLabel>
                                <TextField
                                    id="password"
                                    label=""
                                    type={secure ? "text" : "password"}
                                    variant="outlined"
                                    size="small"
                                    color="primary"
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end" sx={{ pr: 0.5 }}>
                                                <IconButton
                                                    onClick={() => {
                                                        setSecure((prev: boolean) => !prev)
                                                    }}
                                                    edge="end"
                                                >
                                                    {secure ? (
                                                        <Hide fontSize="small" />
                                                    ) : (
                                                        <Show fontSize="small" />
                                                    )}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    error={error}
                                // onKeyDown={enter}
                                />
                                <FormHelperText>
                                    {error && "Oops! Wrong username/password!"}
                                </FormHelperText>
                            </FormControl>
                        </>
                        :
                        <>
                            <FormControl error={error} sx={{ gap: 0.5 }}>
                                <FormLabel>New Password</FormLabel>
                                <TextField
                                    id="new_password"
                                    label=""
                                    type={secure ? "text" : "password"}
                                    variant="outlined"
                                    size="small"
                                    color="primary"
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end" sx={{ pr: 0.5 }}>
                                                <IconButton
                                                    onClick={() => {
                                                        setSecure((prev: boolean) => !prev)
                                                    }}
                                                    edge="end"
                                                >
                                                    {secure ? (
                                                        <Hide fontSize="small" />
                                                    ) : (
                                                        <Show fontSize="small" />
                                                    )}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                    value={newPassword}
                                    onChange={(event) => setNewPassword(event.target.value)}
                                    error={error}
                                // onKeyDown={enter}
                                />
                            </FormControl>
                            <FormControl error={error} sx={{ gap: 0.5 }}>
                                <FormLabel>Re-enter Password</FormLabel>
                                <TextField
                                    id="re_enter_password"
                                    label=""
                                    type={secure ? "text" : "password"}
                                    variant="outlined"
                                    size="small"
                                    color="primary"
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end" sx={{ pr: 0.5 }}>
                                                <IconButton
                                                    onClick={() => {
                                                        setSecure((prev: boolean) => !prev)
                                                    }}
                                                    edge="end"
                                                >
                                                    {secure ? (
                                                        <Hide fontSize="small" />
                                                    ) : (
                                                        <Show fontSize="small" />
                                                    )}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                    value={retypedPassword}
                                    onChange={(event) => setRetypedPassword(event.target.value)}
                                    error={error}
                                // onKeyDown={enter}
                                />
                                <FormHelperText>
                                    {error && "Oops! Passwords do not match."}
                                </FormHelperText>
                            </FormControl>
                        </>
                    }
                </Stack>

            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
                <LoadingButton variant="contained" loading={loading} onClick={!reauthenticated ? reauthenticate : change}>
                    {!reauthenticated ? "Verify" : "Change Password"}
                </LoadingButton>
                <Button color="error" onClick={onClose}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    )
}
