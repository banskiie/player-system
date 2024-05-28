import { onAuthStateChanged } from "firebase/auth"
import { useAuthStore } from "./store/auth"
import { AUTH } from "./api/firebase"
import { useEffect } from "react"
import Routes from "./routes/Routes"

export default () => {
  const { updateUser } = useAuthStore((state) => state)

  // Check Auth
  useEffect(() => {
    const authCheck = onAuthStateChanged(AUTH, (user) => {
      updateUser(!!user ? user : null)
    })

    authCheck()
  }, [AUTH])

  return <Routes />
}
