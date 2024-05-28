import { collection, onSnapshot } from "firebase/firestore"
import { useEffect, useState } from "react"
import { DB } from "../api/firebase"
import {
  Box,
  Card,
  Grid,
  Typography,
  CardContent,
  Stack,
  FormControl,
  MenuItem,
  Select,
  LinearProgress,
  Paper,
} from "@mui/material"
import {
  Group as Players,
  SportsScore as Clubs,
  EmojiEvents as Tournaments,
} from "@mui/icons-material"
import { ViewTournament } from "./Tournaments"
import { PageLoader } from "../components/ui/Loading"
import moment, { Moment } from "moment"
import { NavLink, redirect, Route } from "react-router-dom"

export default () => {
  const [data, setData] = useState<any>(null)
  const [dates, setDates] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [upcomingTournament, setUpcomingTournament] = useState<any>(null)
  const [onGoingTournaments, setOnGoingTournaments] = useState<any[]>([])
  const [openView, setOpenView] = useState<boolean>(false)
  const [id, setId] = useState<string | null>()

  useEffect(() => {
    const fetch = async () => {
      try {
        const playersRef = collection(DB, "players")
        const clubsRef = collection(DB, "clubs")
        const tournamentsRef = collection(DB, "tournaments")
        const playersSub = onSnapshot(playersRef, {
          next: (snapshot) => {
            if (!snapshot.empty) {
              setData((prev: any) => {
                return {
                  ...prev,
                  players: snapshot.docs.map((doc: any) => {
                    return {
                      id: doc.id,
                      ...doc.data(),
                    }
                  }),
                }
              })
            }
          },
        })
        const clubsSub = onSnapshot(clubsRef, {
          next: (snapshot) => {
            if (!snapshot.empty) {
              setData((prev: any) => {
                return {
                  ...prev,
                  clubs: snapshot.docs.map((doc: any) => {
                    return {
                      id: doc.id,
                      ...doc.data(),
                    }
                  }),
                }
              })
            }
          },
        })
        const tournamentsSub = onSnapshot(tournamentsRef, {
          next: (snapshot) => {
            if (!snapshot.empty) {
              setData((prev: any) => {
                return {
                  ...prev,
                  tournaments: snapshot.docs.map((doc: any) => {
                    return {
                      id: doc.id,
                      ...doc.data(),
                    }
                  }),
                }
              })
            }
          },
        })

        return () => {
          playersSub()
          clubsSub()
          tournamentsSub()
        }
      } catch (error: any) {
        console.error(error)
      }
    }

    fetch()

    return () => {
      setData(null)
      setDates([])
      setSelectedDate("")
    }
  }, [])

  useEffect(() => {
    if (data?.players && data?.clubs && data?.tournaments) {
      const extractDates = (items: any[]) =>
        items.map((item) =>
          moment.unix(item.created_at.seconds).format("MMMM YYYY")
        )

      const playerDates = extractDates(data.players)
      const clubDates = extractDates(data.clubs)
      const tournamentDates = data.tournaments.map((tournament: any) =>
        moment.unix(tournament.start.seconds).format("MMMM YYYY")
      )

      const allDates = [...playerDates, ...clubDates, ...tournamentDates]
      const filteredDates = [...new Set(allDates)] // Use Set to filter unique dates

      setSelectedDate(moment().format("MMMM YYYY"))
      setDates(filteredDates)
    }

    if (data?.tournaments) {
      setUpcomingTournament(fetchUpcoming(data?.tournaments))
      setOnGoingTournaments(fetchOnGoing(data?.tournaments))
    }
  }, [data])

  const handleOpenView = (id: string) => {
    if (id) setId(id)
    setOpenView(true)
  }

  const handleCloseView = () => {
    if (id) {
      setTimeout(() => {
        setId(null)
      }, 125)
    }
    setOpenView(false)
  }

  const fetchUpcoming = (tournaments: any) => {
    const today = moment()
    const futureDates = tournaments
      .map((date: any) => moment.unix(date.start.seconds))
      .filter((date: Moment) => date.isAfter(today))
      .sort((prev: any, next: any) => prev - next)
    const latestDate = futureDates.length > 0 ? futureDates[0] : null

    const latestUpcomingTournament = !!latestDate
      ? tournaments.find((tournament: any) =>
          moment.unix(tournament.start.seconds).isSame(latestDate)
        )
      : null

    return latestUpcomingTournament
  }

  const fetchOnGoing = (tournaments: any) => {
    const today = moment()
    const onGoingTournament = tournaments.filter(
      (tournament: any) =>
        moment.unix(tournament.start.seconds) <= today &&
        today <= moment.unix(tournament.end.seconds)
    )

    return onGoingTournament
  }

  return (
    <Box sx={{ height: "100%" }}>
      <ViewTournament id={id} open={openView} onClose={handleCloseView} />
      {!data ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
          }}
        >
          <PageLoader />
        </Box>
      ) : (
        <Grid container spacing={2} px={4} py={1}>
          <Grid item xs={12}>
            <FormControl sx={{ gap: 1, width: 300 }}>
              <Select
                displayEmpty
                MenuProps={{
                  PaperProps: { sx: { maxHeight: 260 } },
                }}
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {dates?.map((date: string, index: number) => (
                  <MenuItem key={index} value={date}>
                    {date}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={4}>
            <Paper
              component={NavLink}
              sx={{
                textDecoration: "none",
              }}
              to="/players"
            >
              <Card
                sx={{
                  "&:hover": {
                    boxShadow: 3,
                  },
                }}
              >
                <CardContent
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Stack sx={{ ml: 1 }}>
                    <Typography
                      variant="h6"
                      color="gray"
                      fontWeight={600}
                      sx={{ mb: -1.25 }}
                    >
                      Players
                    </Typography>
                    <Typography variant="h2" fontWeight={900}>
                      {!!selectedDate
                        ? data?.players?.filter(
                            (player: any) =>
                              moment
                                .unix(player.created_at.seconds)
                                .format("MMMM YYYY") == selectedDate
                          ).length
                        : data?.players?.length}
                    </Typography>
                    <Typography sx={{ mt: -1.25 }}>
                      {!selectedDate
                        ? "in total"
                        : selectedDate === moment().format("MMMM YYYY")
                        ? "added this month"
                        : "added on " + selectedDate}
                    </Typography>
                  </Stack>
                  <Players
                    fontSize="large"
                    sx={{
                      fontSize: 90,
                      color: "success.main",
                    }}
                  />
                </CardContent>
              </Card>
            </Paper>
          </Grid>
          <Grid item xs={4}>
            <Paper
              component={NavLink}
              sx={{
                textDecoration: "none",
              }}
              to="/clubs"
            >
              <Card
                sx={{
                  "&:hover": {
                    boxShadow: 3,
                  },
                }}
              >
                <CardContent
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Stack sx={{ ml: 1 }}>
                    <Typography
                      sx={{ mb: -1.25 }}
                      variant="h6"
                      color="gray"
                      fontWeight={600}
                    >
                      Clubs
                    </Typography>
                    <Typography variant="h2" fontWeight={900}>
                      {!!selectedDate
                        ? data?.clubs?.filter(
                            (club: any) =>
                              moment
                                .unix(club.created_at.seconds)
                                .format("MMMM YYYY") == selectedDate
                          ).length
                        : data?.clubs?.length}
                    </Typography>
                    <Typography sx={{ mt: -1.25 }}>
                      {!selectedDate
                        ? "in total"
                        : selectedDate === moment().format("MMMM YYYY")
                        ? "added this month"
                        : "added on " + selectedDate}
                    </Typography>
                  </Stack>
                  <Clubs
                    fontSize="large"
                    sx={{
                      fontSize: 90,
                      color: "warning.main",
                    }}
                  />
                </CardContent>
              </Card>
            </Paper>
          </Grid>
          <Grid item xs={4}>
            <Paper
              component={NavLink}
              sx={{
                textDecoration: "none",
              }}
              to="/tournaments"
            >
              <Card
                sx={{
                  "&:hover": {
                    boxShadow: 3,
                  },
                }}
              >
                <CardContent
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Stack sx={{ ml: 1 }}>
                    <Typography
                      sx={{ mb: -1.25 }}
                      variant="h6"
                      color="gray"
                      fontWeight={600}
                    >
                      Tournaments
                    </Typography>
                    <Typography variant="h2" fontWeight={900}>
                      {!!selectedDate
                        ? data?.tournaments?.filter(
                            (tournament: any) =>
                              moment
                                .unix(tournament.start.seconds)
                                .format("MMMM YYYY") == selectedDate
                          ).length
                        : data?.tournaments?.length}
                    </Typography>
                    <Typography sx={{ mt: -1.25 }}>
                      {!selectedDate
                        ? "in total"
                        : selectedDate === moment().format("MMMM YYYY")
                        ? "scheduled this month"
                        : "scheduled on " + selectedDate}
                    </Typography>
                  </Stack>
                  <Tournaments
                    fontSize="large"
                    sx={{
                      fontSize: 90,
                      color: "info.main",
                    }}
                  />
                </CardContent>
              </Card>
            </Paper>
          </Grid>
          <Grid item xs={5}>
            <Card>
              <CardContent>
                <Stack gap={1}>
                  <Typography variant="h6" color="gray" fontWeight={600}>
                    Player Statistics
                  </Typography>
                  <Box>
                    <LinearProgress
                      sx={{ height: 20, borderRadius: 5 }}
                      variant="determinate"
                      value={
                        (data?.players?.filter(
                          (player: any) => player.player_details.level != ""
                        ).length /
                          data?.players?.length) *
                        100
                      }
                      color="success"
                    />
                    <Typography variant="body1">
                      {(data?.players?.filter(
                        (player: any) => player.player_details.level != ""
                      ).length /
                        data?.players?.length) *
                        100}
                      % of players have an assigned level
                    </Typography>
                  </Box>
                  <Box>
                    <LinearProgress
                      sx={{ height: 20, borderRadius: 5 }}
                      variant="determinate"
                      value={
                        (data?.players?.filter(
                          (player: any) => player.player_details.club != ""
                        ).length /
                          data?.players?.length) *
                        100
                      }
                      color="warning"
                    />
                    <Typography variant="body1">
                      {(data?.players?.filter(
                        (player: any) => player.player_details.club != ""
                      ).length /
                        data?.players?.length) *
                        100}
                      % of players are in a club
                    </Typography>
                  </Box>
                  <Box>
                    <LinearProgress
                      sx={{ height: 20, borderRadius: 5 }}
                      variant="determinate"
                      value={
                        (data?.players?.filter(
                          (player: any) =>
                            player.history.tournaments_joined.length > 0
                        ).length /
                          data?.players?.length) *
                        100
                      }
                      color="info"
                    />
                    <Typography variant="body1">
                      {(data?.players?.filter(
                        (player: any) =>
                          player.history.tournaments_joined.length > 0
                      ).length /
                        data?.players?.length) *
                        100}
                      % of players have joined a tournament
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={7}>
            <Card>
              <CardContent>
                <Stack gap={1}>
                  <Typography variant="h6" color="gray" fontWeight={600}>
                    On Going Tournaments
                  </Typography>
                  {onGoingTournaments?.length > 0 ? (
                    onGoingTournaments.map((tournament: any, index: number) => (
                      <Card
                        key={index}
                        elevation={0}
                        sx={{
                          bgcolor: "wheat",
                          display: "flex",
                          alignItems: "center",
                          width: "100%",
                          cursor: "pointer",
                          "&:hover": {
                            boxShadow: 3,
                          },
                        }}
                        onClick={() => handleOpenView(tournament.id)}
                      >
                        <CardContent
                          sx={{ display: "flex", alignItems: "center", gap: 3 }}
                        >
                          <Stack
                            sx={{
                              width: 68,
                              height: 74,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Typography
                              sx={{
                                mb: -1,
                                textTransform: "uppercase",
                                color: "warning.dark",
                              }}
                              variant="h5"
                              fontWeight="bold"
                            >
                              {moment
                                .unix(tournament.start.seconds)
                                .format("MMM")}
                            </Typography>
                            <Typography
                              variant="h3"
                              fontWeight="bold"
                              color="warning.dark"
                            >
                              {moment
                                .unix(tournament.start.seconds)
                                .format("DD")}
                            </Typography>
                          </Stack>
                          <Stack
                            sx={{
                              justifyContent: "start",
                              alignItems: "start",
                            }}
                          >
                            <Typography variant="h5" fontWeight="bold">
                              {tournament.name}
                            </Typography>
                            <Stack
                              direction="row"
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 1,
                              }}
                            >
                              <Stack
                                direction="row"
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: 0.3,
                                }}
                              >
                                <Typography variant="caption">
                                  START:
                                </Typography>
                                <Typography variant="caption">
                                  {moment
                                    .unix(tournament.start.seconds)
                                    .format("MMMM D, YYYY (dddd)")}{" "}
                                </Typography>
                              </Stack>
                              <Stack
                                direction="row"
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: 0.3,
                                }}
                              >
                                <Typography variant="caption">END:</Typography>
                                <Typography variant="caption">
                                  {moment
                                    .unix(tournament.end.seconds)
                                    .format("MMMM D, YYYY (dddd)")}{" "}
                                </Typography>
                              </Stack>
                            </Stack>
                            <Typography variant="caption">
                              ADDRESS:{" "}
                              {`${Object.entries(tournament.location)
                                .filter(([key, value]) => value)
                                .sort(([prev], [next]) =>
                                  prev.localeCompare(next)
                                )
                                .map(([key, value]) => value)
                                .reverse()
                                .join(", ")}`}
                            </Typography>
                          </Stack>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Typography>No On-Going Tournament</Typography>
                  )}
                  <Typography variant="h6" color="gray" fontWeight={600}>
                    Upcoming Tournament
                  </Typography>
                  {!!upcomingTournament ? (
                    <Card
                      elevation={0}
                      sx={{
                        bgcolor: "#9ed1ed",
                        display: "flex",
                        alignItems: "center",
                        width: "100%",
                        cursor: "pointer",
                        "&:hover": {
                          boxShadow: 3,
                        },
                      }}
                      onClick={() => handleOpenView(upcomingTournament.id)}
                    >
                      <CardContent
                        sx={{ display: "flex", alignItems: "center", gap: 3 }}
                      >
                        <Stack
                          sx={{
                            width: 68,
                            height: 74,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Typography
                            sx={{
                              mb: -1,
                              textTransform: "uppercase",
                              color: "info.dark",
                            }}
                            variant="h5"
                            fontWeight="bold"
                          >
                            {moment
                              .unix(upcomingTournament.start.seconds)
                              .format("MMM")}
                          </Typography>
                          <Typography
                            variant="h3"
                            fontWeight="bold"
                            color="info.dark"
                          >
                            {moment
                              .unix(upcomingTournament.start.seconds)
                              .format("DD")}
                          </Typography>
                        </Stack>
                        <Stack
                          sx={{
                            justifyContent: "start",
                            alignItems: "start",
                          }}
                        >
                          <Typography variant="h5" fontWeight="bold">
                            {upcomingTournament.name}
                          </Typography>
                          <Stack
                            direction="row"
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 1,
                            }}
                          >
                            <Stack
                              direction="row"
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 0.3,
                              }}
                            >
                              <Typography variant="caption">START:</Typography>
                              <Typography variant="caption">
                                {moment
                                  .unix(upcomingTournament.start.seconds)
                                  .format("MMMM D, YYYY (dddd)")}{" "}
                              </Typography>
                            </Stack>
                            <Stack
                              direction="row"
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 0.3,
                              }}
                            >
                              <Typography variant="caption">END:</Typography>
                              <Typography variant="caption">
                                {moment
                                  .unix(upcomingTournament.end.seconds)
                                  .format("MMMM D, YYYY (dddd)")}{" "}
                              </Typography>
                            </Stack>
                          </Stack>
                          <Typography variant="caption">
                            ADDRESS:{" "}
                            {`${Object.entries(upcomingTournament.location)
                              .filter(([key, value]) => value)
                              .sort(([prev], [next]) =>
                                prev.localeCompare(next)
                              )
                              .map(([key, value]) => value)
                              .reverse()
                              .join(", ")}`}
                          </Typography>
                        </Stack>
                      </CardContent>
                    </Card>
                  ) : (
                    <Typography>No Upcoming Tournaments.</Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  )
}
