import { useEffect, useState } from "react"
import {
  Box,
  Container,
  FormControl,
  Stack,
  TextField,
  FormLabel,
  FormHelperText,
  Typography,
  Link,
  IconButton,
  InputAdornment,
} from "@mui/material"
import {
  VisibilityRounded as Show,
  VisibilityOffRounded as Hide,
} from "@mui/icons-material"
import { LoadingButton } from "@mui/lab"
import logo from "../assets/images/splash.png"
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth"
import { AUTH, DB } from "../api/firebase"
import { useAuthStore } from "../store/auth"
import ForgotPassword from "../components/modals/ForgotPassword"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"

export default () => {
  const { updateUser: UPDATE_USER } = useAuthStore((state) => state)
  // Form Items
  const [displayName, setDisplayName] = useState<string>("")
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  // Form Settings
  const [secure, setSecure] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<boolean>(false)
  // Forgot Password
  const [showForgot, setShowForgot] = useState<boolean>(false)
  // Register
  const [isSignUp, setIsSignUp] = useState<boolean>(false)

  const login = async () => {
    setLoading(true)
    try {
      const res = await signInWithEmailAndPassword(AUTH, email, password)
      if (res) {
        UPDATE_USER(res.user)
        await addDoc(collection(DB, "history"), {
          created_at: serverTimestamp(),
          user: res.user?.displayName,
          action: "logged in",
        })
      }
    } catch (error: any) {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const signUp = async () => {
    try {
      setLoading(true)
      const res = await createUserWithEmailAndPassword(AUTH, email, password)
      const authUser = getAuth()
      if (authUser.currentUser) {
        await updateProfile(authUser.currentUser, {
          displayName,
        })
        await addDoc(collection(DB, "history"), {
          created_at: serverTimestamp(),
          user: displayName,
          action: "registered and logged in as new user.",
        })
      }
      if (res) {
        UPDATE_USER(res.user)
      }
    } catch (error) {
      console.error("Error registering user:", error)
    }
  }

  const enter = (event: any) => {
    if (error) {
      setError(false)
    }

    if (event.key == "Enter") {
      isSignUp ? signUp() : login()
    }
  }

  return (
    <Container
      maxWidth={false}
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "row",
      }}
      disableGutters
    >
      <ForgotPassword open={showForgot} onClose={() => setShowForgot(false)} />
      <Box flexGrow={1} bgcolor="secondary.main"></Box>
      <Box
        sx={{
          width: "27%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            height: "45%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pt: 4,
          }}
        >
          <img src={logo} style={{ height: "60%" }} />
        </Box>
        <Stack
          sx={{
            height: "50%",
            width: "75%",
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          {isSignUp && (
            <FormControl error={error} sx={{ gap: 0.5 }}>
              <FormLabel>Name</FormLabel>
              <TextField
                id="name"
                label=""
                variant="outlined"
                size="small"
                color="primary"
                margin="none"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                error={error}
                onKeyDown={enter}
              />
            </FormControl>
          )}
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
              onKeyDown={enter}
            />
          </FormControl>
          <FormControl error={error} sx={{ gap: 0.5 }}>
            <FormLabel>Password</FormLabel>
            <TextField
              id="username"
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
              onKeyDown={enter}
            />
            <FormHelperText>
              {error && "Oops! Wrong username/password!"}
            </FormHelperText>
          </FormControl>
          <LoadingButton
            loading={loading}
            variant="contained"
            color="primary"
            size="large"
            sx={{ mt: 2 }}
            onClick={isSignUp ? signUp : login}
          >
            {isSignUp ? "Sign Up" : "Log in"}
          </LoadingButton>
          <LoadingButton
            loading={loading}
            variant="outlined"
            color="warning"
            size="large"
            onClick={() => setIsSignUp((prev) => !prev)}
          >
            {isSignUp ? "Back to Login" : "Create Account"}
          </LoadingButton>
          {!isSignUp && (
            <Link
              variant="caption"
              textAlign="center"
              style={{ cursor: "pointer" }}
              onClick={() => setShowForgot(true)}
            >
              Forgot Password?
            </Link>
          )}
        </Stack>
        <Typography variant="subtitle1" sx={{ height: "5%" }}>
          © 2024 C-ONE Dev Team
        </Typography>
      </Box>
    </Container>
  )
}
