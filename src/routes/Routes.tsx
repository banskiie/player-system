import { Navigate, Route, Routes } from "react-router-dom"
import { useAuthStore } from "../store/auth"
import Default from "../layout/Default"
import Home from "../pages/Home"
import Players from "../pages/Players"
import Login from "../auth/Login"
import Clubs from "../pages/Clubs"
import Tournaments from "../pages/Tournaments"
import History from "../pages/History"

export default () => {
  const { user } = useAuthStore((state) => state)

  return (
    <Routes>
      {!!user ? (
        <Route Component={Default}>
          <Route index path="/" element={<Home />} />
          <Route path="/players" element={<Players />} />
          <Route path="/clubs" element={<Clubs />} />
          <Route path="/tournaments" element={<Tournaments />} />
          <Route path="/history" element={<History />} />
        </Route>
      ) : (
        <Route index path="/" element={<Login />} />
      )}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
