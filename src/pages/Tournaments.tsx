import { Fragment, useEffect, useReducer, useState } from "react"
import {
  Box,
  Button,
  ButtonGroup,
  IconButton,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  FormHelperText,
  TextField,
  Backdrop,
  DialogContentText,
  Grid,
  Divider,
  MenuItem,
  Select,
  Typography,
  Stack,
  Tooltip,
} from "@mui/material"
import {
  DataGrid,
  GridColDef,
  GridToolbarContainer,
  GridToolbarQuickFilter,
} from "@mui/x-data-grid"
import { Delete, Edit, AddCircle as Add, Cancel } from "@mui/icons-material"
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore"
import { DB } from "../api/firebase"
import { LoadingButton } from "@mui/lab"
import { DialogProps, ToolbarProps } from "../interfaces/props"
import {
  InitialTournamentState,
  TournamentReducer,
} from "../reducers/tournament"
import { PageLoader } from "../components/ui/Loading"
import { useNotifStore } from "../store/notif"
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import moment from "moment"
import { useOptionStore } from "../store/option"
import styles from "../styles/datagrid.module.css"
import { useAuthStore } from "../store/auth"

const TournamentGridToolbar = ({ action }: ToolbarProps) => {
  return (
    <GridToolbarContainer
      sx={{ display: "flex", justifyContent: "space-between", p: 1 }}
    >
      <GridToolbarQuickFilter />
      <Button
        size="small"
        variant="contained"
        startIcon={<Add fontSize="inherit" />}
        onClick={() => action()}
      >
        Add Tournament
      </Button>
    </GridToolbarContainer>
  )
}

const TournamentForm = ({ id, edit, open, onClose }: DialogProps) => {
  const { user } = useAuthStore(state => state)
  const { showNotif } = useNotifStore((state) => state)
  // Data
  const [payload, dispatch] = useReducer(
    TournamentReducer,
    InitialTournamentState
  )
  const { name, organizer, location, start, end, events } = payload
  // Form
  const [loading, setLoading] = useState<boolean>(false)
  const [errors, setErrors] = useState<any>(null)
  // Options
  const { provinces, municipalities, barangays } = useOptionStore(
    (state) => state
  )

  useEffect(() => {
    if (id) {
      const fetch = async () => {
        setLoading(true)
        try {
          const ref = doc(DB, `tournaments/${id}`)
          const snapshot = await getDoc(ref)

          if (snapshot.exists()) {
            const data = snapshot.data()
            for (const key in data) {
              if (key in InitialTournamentState) {
                if (key === "start" || key === "end") {
                  set(key, moment.unix(data[key].seconds).toDate())
                } else {
                  set(key, data[key])
                }
              }
            }
          }
        } catch (error: unknown) {
          console.error(error)
        } finally {
          setLoading(false)
        }
      }

      fetch()
    }

    return () => dispatch({ type: "RESET_FIELDS" })
  }, [id])

  const set = (field: string, value: any, index?: number) => {
    const fields = field.split(".")
    const [object, attribute] = fields
    if (object === "events" && index != null) {
      setErrors((prev: any) => {
        // Removal of "s" in "events"
        return {
          ...prev,
          [`${object.slice(0, -1)}.${attribute}[${index}]`]: "",
        }
      })
    } else {
      setErrors((prev: any) => {
        return { ...prev, [field]: "" }
      })
    }

    if (fields.length >= 2) {
      if (object === "events" && index != null) {
        const updatedEvents = [...events]
        updatedEvents[index] = {
          ...updatedEvents[index],
          [attribute]: value,
        }
        dispatch({ type: "SET_FIELD", field: object, value: updatedEvents })
      } else if (object === "location") {
        switch (attribute) {
          case "province":
            dispatch({
              type: "SET_FIELD",
              field: object,
              value: {
                ...payload[object],
                ["municipality"]: "",
                ["barangay"]: "",
                [attribute]: value,
              },
            })
            break
          case "municipality":
            dispatch({
              type: "SET_FIELD",
              field: object,
              value: {
                ...payload[object],
                ["barangay"]: "",
                [attribute]: value,
              },
            })
            break
          default:
            dispatch({
              type: "SET_FIELD",
              field: object,
              value: { ...payload[object], [attribute]: value },
            })
            break
        }
      }
    } else {
      dispatch({ type: "SET_FIELD", field, value })
    }
  }

  const validate = () => {
    let newErrors: any = {}
    const defaultMessage = "This field is required."

    if (!(name && name.trim())) {
      newErrors.name = defaultMessage
      dispatch({ type: "SET_FIELD", field: "name", value: "" })
    }
    if (!(organizer && organizer.trim())) {
      newErrors.organizer = defaultMessage
      dispatch({ type: "SET_FIELD", field: "organizer", value: "" })
    }
    if (!(location.address && location.address.trim())) {
      newErrors["location.address"] = defaultMessage
      dispatch({ type: "SET_FIELD", field: "location.address", value: "" })
    }
    if (!(location.province && location.province.trim())) {
      newErrors["location.province"] = defaultMessage
      dispatch({ type: "SET_FIELD", field: "location.province", value: "" })
    }
    if (events.length > 0) {
      events.map((event: any, index: number) => {
        const eventValues = Object.values(event)
        if (eventValues.some((value) => value)) {
          if (!(event.name && event.name.trim())) {
            newErrors[`event.name[${index}]`] = defaultMessage
          }
          if (!event.gender) {
            newErrors[`event.gender[${index}]`] = defaultMessage
          }
          if (!event.count) {
            newErrors[`event.count[${index}]`] = defaultMessage
          }
          if (!(event.level && event.level.trim())) {
            newErrors[`event.level[${index}]`] = defaultMessage
          }
        }
      })
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const addEvent = () => {
    const updatedEvents = [...events]
    updatedEvents.push({
      name: "",
      gender: "",
      count: "",
      level: "",
    })
    dispatch({ type: "SET_FIELD", field: "events", value: updatedEvents })
  }

  const removeEvent = (index: number) => {
    setErrors((prev: any) => {
      return {
        ...prev,
        [`event.name[${index}]`]: "",
        [`event.gender[${index}]`]: "",
        [`event.count[${index}]`]: "",
        [`event.level[${index}]`]: "",
      }
    })
    const updatedEvents = [...events]
    if (index == 0 && events.length <= 1) {
      updatedEvents[index] = {
        name: "",
        gender: "",
        count: "",
        level: "",
      }
    } else {
      updatedEvents.splice(index, 1)
    }

    dispatch({ type: "SET_FIELD", field: "events", value: updatedEvents })
  }

  const submit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      edit
        ? await updateDoc(doc(DB, `tournaments/${id}`), payload)
        : await addDoc(collection(DB, "tournaments"), {
          created_at: serverTimestamp(),
          ...payload,
        })
      edit ? await addDoc(collection(DB, "history"), {
        created_at: serverTimestamp(),
        user: user?.displayName,
        action: `updated details of tournament, ${name}.`,
      }) : await addDoc(collection(DB, "history"), {
        created_at: serverTimestamp(),
        user: user?.displayName,
        action: `added new tournament, ${name}.`,
      })
      showNotif(
        edit
          ? "Tournament updated successfully!"
          : "Tournament added successfully!",
        "success"
      )
      close()
    } catch (error: unknown) {
      console.error("Error inserting document:", error)
    } finally {
      setLoading(false)
    }
  }

  const enter = (event: any) => {
    if (event.key == "Enter") {
      submit()
    }
  }

  const close = () => {
    onClose()
    setTimeout(() => {
      dispatch({ type: "RESET_FIELDS" })
      setErrors(null)
    }, 125)
  }

  return (
    <Backdrop sx={{ zIndex: 1 }} open={open}>
      {loading ? (
        <PageLoader />
      ) : (
        <Dialog
          open={open}
          onClose={close}
          maxWidth="md"
          hideBackdrop
          fullWidth
        >
          <DialogTitle>
            {edit ? `Update Tournament: ${name}` : "Add Tournament"}
            <Typography variant="body2" component="div">
              Fields with (
              <Typography variant="inherit" display="inline" color="error">
                *
              </Typography>
              ) are required.
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Grid container columnSpacing={2} rowSpacing={1}>
              <Grid item xs={12}>
                <Divider sx={{ mb: 1 }}>Details</Divider>
              </Grid>
              <Grid item xs={12}>
                <FormControl
                  required
                  error={!!errors?.name}
                  sx={{ gap: 1 }}
                  fullWidth
                >
                  <FormLabel>Tournament Name</FormLabel>
                  <TextField
                    id="tournament_name"
                    label=""
                    value={name}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      set("name", event.target.value)
                    }
                    placeholder="Enter Tournament Name"
                    onKeyDown={enter}
                    error={!!errors?.name}
                    helperText={!!errors?.name && errors.name}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl
                  required
                  error={!!errors?.organizer}
                  sx={{ gap: 1 }}
                  fullWidth
                >
                  <FormLabel>Tournament Organizer</FormLabel>
                  <TextField
                    id="tournament_organizer"
                    label=""
                    value={organizer}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      set("organizer", event.target.value)
                    }
                    placeholder="Enter Tournament Organizer (Organization/Individual)"
                    onKeyDown={enter}
                    error={!!errors?.organizer}
                    helperText={!!errors?.organizer && errors.organizer}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <Grid container columnSpacing={2}>
                    <Grid item xs={6}>
                      <FormControl required fullWidth sx={{ gap: 1 }}>
                        <FormLabel>Start Date</FormLabel>
                        <DatePicker
                          label=""
                          value={moment(start)}
                          maxDate={moment(end)}
                          onChange={(value) =>
                            set("start", moment(value).toDate())
                          }
                        />
                      </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                      <FormControl required fullWidth sx={{ gap: 1 }}>
                        <FormLabel>End Date</FormLabel>
                        <DatePicker
                          label=""
                          value={moment(end)}
                          minDate={moment(start)}
                          onChange={(value) =>
                            set("end", moment(value).toDate())
                          }
                        />
                      </FormControl>
                    </Grid>
                  </Grid>
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ mt: 1 }}>Location</Divider>
              </Grid>
              <Grid item xs={12}>
                <FormControl
                  required
                  error={!!errors?.["location.address"]}
                  sx={{ gap: 1 }}
                  fullWidth
                >
                  <FormLabel>Address</FormLabel>
                  <TextField
                    id="address"
                    label=""
                    value={location.address}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      set("location.address", event.target.value)
                    }
                    placeholder="Enter Tournament Address"
                    onKeyDown={enter}
                    error={!!errors?.["location.address"]}
                    helperText={
                      !!errors?.["location.address"] &&
                      errors["location.address"]
                    }
                  />
                </FormControl>
              </Grid>
              <Grid item xs={4}>
                <FormControl
                  required
                  error={!!errors?.["location.province"]}
                  sx={{ gap: 1 }}
                  fullWidth
                >
                  <FormLabel>Province</FormLabel>
                  <Select
                    displayEmpty
                    MenuProps={{ PaperProps: { sx: { maxHeight: 260 } } }}
                    id="province"
                    value={location.province}
                    onChange={(event) =>
                      set("location.province", event.target.value)
                    }
                    error={!!errors?.["location.province"]}
                  >
                    <MenuItem disabled value="">
                      <Typography variant="inherit" color="#c0c0c0">
                        Select Province
                      </Typography>
                    </MenuItem>
                    {provinces.map((province: any, index: number) => (
                      <MenuItem key={index} value={province.name}>
                        {province.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText sx={{ my: -0.75 }}>
                    {!!errors?.["location.province"] &&
                      errors["location.province"]}
                  </FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={4}>
                <FormControl
                  sx={{ gap: 1 }}
                  disabled={
                    !location.province ||
                    municipalities.filter(
                      (municipality: any) =>
                        location.province.toLowerCase() ==
                        municipality.province.toLowerCase()
                    ).length <= 0
                  }
                  fullWidth
                >
                  <FormLabel>Municipality</FormLabel>
                  <Select
                    displayEmpty
                    MenuProps={{ PaperProps: { sx: { maxHeight: 260 } } }}
                    id="municipality"
                    value={location.municipality}
                    onChange={(event) =>
                      set("location.municipality", event.target.value)
                    }
                  >
                    <MenuItem disabled value="">
                      <Typography variant="inherit" color="#c0c0c0">
                        Select Municipality/City
                      </Typography>
                    </MenuItem>
                    {location.province &&
                      municipalities
                        .filter(
                          (municipality: any) =>
                            location.province.toLowerCase() ==
                            municipality.province.toLowerCase()
                        )
                        .map((municipality: any, index: number) => (
                          <MenuItem key={index} value={municipality.name}>
                            {municipality.name}
                          </MenuItem>
                        ))}
                  </Select>
                  <FormHelperText></FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={4}>
                <FormControl
                  sx={{ gap: 1 }}
                  disabled={!location.municipality}
                  fullWidth
                >
                  <FormLabel>Barangay</FormLabel>
                  <Select
                    displayEmpty
                    MenuProps={{ PaperProps: { sx: { maxHeight: 260 } } }}
                    id="barangay"
                    value={location.barangay}
                    onChange={(event) =>
                      set("location.barangay", event.target.value)
                    }
                  >
                    <MenuItem disabled value="">
                      <Typography variant="inherit" color="#c0c0c0">
                        Select Barangay
                      </Typography>
                    </MenuItem>
                    {location.municipality &&
                      barangays
                        .filter((barangay: any) =>
                          barangay.citymun
                            .toLowerCase()
                            .includes(location.municipality.toLowerCase())
                        )
                        .map((barangay: any, index: number) => (
                          <MenuItem key={index} value={barangay.name}>
                            {barangay.name}
                          </MenuItem>
                        ))}
                  </Select>
                  <FormHelperText></FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ mb: 1 }}>Events</Divider>
                <Grid container columnSpacing={2} rowSpacing={1}>
                  {events.length > 0 &&
                    events.map((event: any, index: number) => {
                      return (
                        <Fragment key={index}>
                          <Grid item xs={3.75}>
                            <FormControl
                              required
                              error={!!errors?.[`event.name[${index}]`]}
                              sx={{ gap: 1 }}
                              fullWidth
                            >
                              <FormLabel>Name</FormLabel>
                              <TextField
                                id={"event_name_" + index}
                                label=""
                                value={event.name}
                                onChange={(
                                  event: React.ChangeEvent<HTMLInputElement>
                                ) =>
                                  set("events.name", event.target.value, index)
                                }
                                onKeyDown={enter}
                                placeholder="Enter Event Name"
                                error={!!errors?.[`event.name[${index}]`]}
                                helperText={
                                  !!errors?.[`event.name[${index}]`] &&
                                  errors[`event.name[${index}]`]
                                }
                              />
                            </FormControl>
                          </Grid>
                          <Grid item xs={2.6}>
                            <FormControl
                              required
                              error={!!errors?.[`event.gender[${index}]`]}
                              sx={{ gap: 1 }}
                              fullWidth
                            >
                              <FormLabel>Gender</FormLabel>
                              <Select
                                displayEmpty
                                MenuProps={{
                                  PaperProps: { sx: { maxHeight: 260 } },
                                }}
                                id={"event_gender_" + index}
                                value={event.gender}
                                onChange={(event) =>
                                  set(
                                    "events.gender",
                                    event.target.value,
                                    index
                                  )
                                }
                                error={!!errors?.[`event.gender[${index}]`]}
                              >
                                <MenuItem disabled value="">
                                  <Typography variant="inherit" color="#c0c0c0">
                                    Enter Event Gender
                                  </Typography>
                                </MenuItem>
                                <MenuItem value={"male"}>Men</MenuItem>
                                <MenuItem value={"female"}>Women</MenuItem>
                                <MenuItem value={"mixed"}>Mixed</MenuItem>
                                <MenuItem value={"non-gender"}>
                                  Non-Gender
                                </MenuItem>
                              </Select>
                              <FormHelperText sx={{ mt: -0.75 }}>
                                {!!errors?.[`event.gender[${index}]`] &&
                                  errors[`event.gender[${index}]`]}
                              </FormHelperText>
                            </FormControl>
                          </Grid>
                          <Grid item xs={2.6}>
                            <FormControl
                              required
                              error={!!errors?.[`event.count[${index}]`]}
                              sx={{ gap: 1 }}
                              fullWidth
                            >
                              <FormLabel>Player Count</FormLabel>
                              <Select
                                displayEmpty
                                MenuProps={{
                                  PaperProps: { sx: { maxHeight: 260 } },
                                }}
                                id={"event_count_" + index}
                                value={event.count}
                                onChange={(event: any) =>
                                  set("events.count", event.target.value, index)
                                }
                                error={!!errors?.[`event.count[${index}]`]}
                              >
                                <MenuItem disabled value="">
                                  <Typography variant="inherit" color="#c0c0c0">
                                    Enter Player Count
                                  </Typography>
                                </MenuItem>
                                <MenuItem value={"singles"}>Singles</MenuItem>
                                <MenuItem value={"doubles"}>Doubles</MenuItem>
                              </Select>
                              <FormHelperText sx={{ mt: -0.75 }}>
                                {!!errors?.[`event.count[${index}]`] &&
                                  errors[`event.count[${index}]`]}
                              </FormHelperText>
                            </FormControl>
                          </Grid>
                          <Grid item xs={2.2}>
                            <FormControl
                              required
                              error={!!errors?.[`event.level[${index}]`]}
                              sx={{ gap: 1 }}
                              fullWidth
                            >
                              <FormLabel>Level</FormLabel>
                              <TextField
                                id={"event_level_" + index}
                                label=""
                                value={event.level}
                                onChange={(
                                  event: React.ChangeEvent<HTMLInputElement>
                                ) =>
                                  set("events.level", event.target.value, index)
                                }
                                onKeyDown={enter}
                                placeholder="Enter Event Level"
                                error={!!errors?.[`event.level[${index}]`]}
                                helperText={
                                  !!errors?.[`event.level[${index}]`] &&
                                  errors[`event.level[${index}]`]
                                }
                              />
                            </FormControl>
                          </Grid>
                          <Grid
                            item
                            xs={0.75}
                            sx={{
                              display: "flex",
                              alignItems: "end",
                              justifyContent: "center",
                              pb: 2.5,
                              pr: 1.25,
                            }}
                          >
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeEvent(index)}
                            >
                              <Cancel fontSize="medium" />
                            </IconButton>
                          </Grid>
                        </Fragment>
                      )
                    })}
                </Grid>
                <Button
                  sx={{ mt: 1 }}
                  variant="outlined"
                  color="info"
                  onClick={addEvent}
                  fullWidth
                >
                  Add Event
                </Button>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <LoadingButton
              loading={loading}
              variant="contained"
              onClick={submit}
            >
              {edit ? "Update" : "Add"}
            </LoadingButton>
            <LoadingButton loading={loading} color="error" onClick={close}>
              Cancel
            </LoadingButton>
          </DialogActions>
        </Dialog>
      )}
    </Backdrop>
  )
}

export const ViewTournament = ({ id, open, onClose }: DialogProps) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [data, setData] = useState<any>()
  const [events, setEvents] = useState<any[]>([])

  useEffect(() => {
    if (id) {
      const fetch = async () => {
        setLoading(true)
        try {
          const ref = doc(DB, `tournaments/${id}`)
          onSnapshot(ref, {
            next: (snapshot) => {
              if (snapshot.exists()) {
                setData(snapshot.data())
                setEvents(
                  snapshot
                    .data()
                    .events.filter(
                      (event: any) =>
                        event.name && event.gender && event.count && event.level
                    )
                    .map((event: any, index: number) => {
                      return {
                        id: index,
                        name: event.name,
                        gender: event.gender,
                        count: event.count,
                        level: event.level,
                      }
                    })
                )
              }
            },
          })
        } catch (error: unknown) {
          console.error(error)
        } finally {
          setLoading(false)
        }
      }

      fetch()
    }

    return () => setData(null)
  }, [id])

  const columns: GridColDef[] = [
    {
      field: "id",
      headerName: "ID",
    },
    {
      field: "name",
      headerName: "Name",
      flex: 1.25,
    },
    {
      field: "gender",
      headerName: "Gender",
      flex: 1,
      renderCell: (params: any) => {
        const gender = params.value
        return (
          <Typography
            variant="inherit"
            color="inherit"
            textTransform="capitalize"
          >
            {gender}
          </Typography>
        )
      },
    },
    {
      field: "count",
      headerName: "Player Count",
      flex: 1,
      renderCell: (params: any) => {
        const count = params.value
        return (
          <Typography
            variant="inherit"
            color="inherit"
            textTransform="capitalize"
          >
            {count}
          </Typography>
        )
      },
    },
    {
      field: "level",
      headerName: "Level",
      flex: 1,
    },
  ]

  const close = () => {
    setTimeout(() => setData(null), 125)
    onClose()
  }

  return (
    <Backdrop sx={{ zIndex: 1 }} open={open}>
      {loading ? (
        <PageLoader />
      ) : (
        <Dialog
          open={open}
          onClose={close}
          maxWidth="md"
          hideBackdrop
          fullWidth
        >
          <DialogTitle>View Tournament: {data?.name}</DialogTitle>
          <DialogContent>
            <Stack sx={{ gap: 1 }}>
              {data?.name && (
                <Box>
                  <Typography variant="body2">Tournament Name</Typography>
                  <Typography variant="body1" fontWeight={700}>
                    {data?.name}
                  </Typography>
                </Box>
              )}
              {!!(data?.start && data?.end) && (
                <Box>
                  <Typography variant="body2">Date</Typography>
                  <Typography variant="body1" fontWeight={700}>
                    {moment(data?.start.toDate()).format("LL")} to{" "}
                    {moment(data?.end.toDate()).format("LL")}
                  </Typography>
                </Box>
              )}
              {data?.organizer && (
                <Box>
                  <Typography variant="body2">Tournament Organizer</Typography>
                  <Typography variant="body1" fontWeight={700}>
                    {data?.organizer}
                  </Typography>
                </Box>
              )}
              {data?.location && (
                <Box>
                  <Typography variant="body2">Location</Typography>
                  <Typography variant="body1" fontWeight={700}>
                    {`${Object.entries(data.location)
                      .filter(([key, value]) => value)
                      .sort(([prev], [next]) => prev.localeCompare(next))
                      .map(([key, value]) => value)
                      .reverse()
                      .join(", ")}`}
                  </Typography>
                </Box>
              )}
              <Box
                sx={{
                  height: 280,
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                }}
              >
                <Typography variant="body2">Events</Typography>
                <DataGrid
                  rows={events}
                  columns={columns}
                  loading={loading}
                  density="compact"
                  slots={{
                    footer: () => (
                      <Box
                        sx={{
                          bgcolor: "#faf9f6",
                          borderTop: "solid 2px #e7e7e7",
                          p: 1,
                        }}
                      >
                        <Typography variant="body2">
                          No. of Events: <b>{events.length}</b>
                        </Typography>
                      </Box>
                    ),
                    noRowsOverlay: () => (
                      <Box
                        sx={{
                          width: "100%",
                          height: "100%",
                          display: "grid",
                          alignItems: "center",
                        }}
                      >
                        <Typography
                          variant="inherit"
                          color="inherit"
                          textAlign="center"
                        >
                          Oops! There are no events.
                        </Typography>
                      </Box>
                    ),
                  }}
                  columnVisibilityModel={{
                    id: false,
                  }}
                  disableRowSelectionOnClick
                />
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <LoadingButton loading={loading} color="error" onClick={close}>
              Close
            </LoadingButton>
          </DialogActions>
        </Dialog>
      )}
    </Backdrop>
  )
}

const RemoveTournament = ({ id, open, onClose }: DialogProps) => {
  const { user } = useAuthStore(state => state)
  const { showNotif } = useNotifStore((state) => state)
  const [loading, setLoading] = useState<boolean>(false)
  const [data, setData] = useState<any>()

  useEffect(() => {
    if (id) {
      const fetch = async () => {
        setLoading(true)
        try {
          const ref = doc(DB, `tournaments/${id}`)
          const snapshot = await getDoc(ref)

          if (snapshot.exists()) {
            setData(snapshot.data())
          }
        } catch (error: unknown) {
          console.error(error)
        } finally {
          setLoading(false)
        }
      }

      fetch()
    }

    return () => setData(null)
  }, [id])

  const remove = async () => {
    setLoading(true)
    try {
      await deleteDoc(doc(DB, `tournaments/${id}`))
      await addDoc(collection(DB, "history"), {
        created_at: serverTimestamp(),
        user: user?.displayName,
        action: `deleted tournament, ${name}.`,
      })
      showNotif("Tournament successfully deleted!", "success")
      close()
    } catch (error: unknown) {
      console.error("Error deleting document:", error)
    } finally {
      setLoading(false)
    }
  }

  const close = () => {
    setTimeout(() => setData(null), 125)
    onClose()
  }

  return (
    <Backdrop sx={{ zIndex: 1 }} open={open}>
      {loading ? (
        <PageLoader />
      ) : (
        <Dialog
          open={open}
          onClose={close}
          maxWidth="sm"
          hideBackdrop
          fullWidth
        >
          <DialogTitle>Delete Tournament: {data?.name}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Would you like to delete {data?.name}?
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <LoadingButton
              loading={loading}
              variant="contained"
              onClick={remove}
            >
              Remove
            </LoadingButton>
            <LoadingButton loading={loading} color="error" onClick={close}>
              Cancel
            </LoadingButton>
          </DialogActions>
        </Dialog>
      )}
    </Backdrop>
  )
}

export default () => {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  // Dialog
  const [openForm, setOpenForm] = useState<boolean>(false)
  const [openView, setOpenView] = useState<boolean>(false)
  const [openRemove, setOpenRemove] = useState<boolean>(false)
  const [id, setId] = useState<string | null>()
  const [edit, setEdit] = useState<boolean>(false)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const ref = collection(DB, "tournaments")
        onSnapshot(query(ref, orderBy("name", "asc")), {
          next: (snapshot) => {
            setRows(
              snapshot.docs.map((doc: any) => ({
                id: doc.id,
                name: doc.data().name,
                organizer: doc.data().organizer,
                date: `${moment
                  .unix(doc.data().start.seconds)
                  .format("LL")} to ${moment
                    .unix(doc.data().end.seconds)
                    .format("LL")}  `,
                actions: { id: doc.id },
              }))
            )
            setLoading(false)
          },
        })
      } catch (error: any) {
        console.error("Error Loading Data: " + error)
      }
    }

    fetch()
  }, [])

  const columns: GridColDef[] = [
    {
      field: "id",
      headerName: "ID",
      width: 90,
      filterable: false,
    },
    {
      field: "name",
      headerName: "Tournament Name",
      flex: 1.5,
    },
    {
      field: "organizer",
      headerName: "Organizer",
      flex: 1,
    },
    {
      field: "date",
      headerName: "Date",
      flex: 1,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      filterable: false,
      renderCell: (params: any) => {
        const actions = params.value
        return (
          <ButtonGroup
            sx={{
              display: "flex",
              alignItems: "center",
              height: "100%",
            }}
          >
            <Tooltip title="Edit">
              <IconButton
                size="small"
                color="info"
                onClick={() => handleOpenForm(true, actions.id)}
              >
                <Edit />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                size="small"
                color="error"
                onClick={() => handleOpenRemove(actions.id)}
              >
                <Delete />
              </IconButton>
            </Tooltip>
          </ButtonGroup>
        )
      },
    },
  ]

  const handleOpenForm = (edit?: boolean, id?: string) => {
    if (id) setId(id)
    if (edit) setEdit(edit)
    setOpenForm(true)
  }

  const handleCloseForm = () => {
    if (id && edit) {
      setTimeout(() => {
        setId(null)
        setEdit(false)
      }, 125)
    }
    setOpenForm(false)
  }

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

  const handleOpenRemove = (id: string) => {
    if (id) setId(id)
    setOpenRemove(true)
  }

  const handleCloseRemove = () => {
    if (id) {
      setTimeout(() => {
        setId(null)
      }, 125)
    }
    setOpenRemove(false)
  }

  return (
    <Box sx={{ height: "100%" }}>
      <TournamentForm
        id={id}
        open={openForm}
        onClose={handleCloseForm}
        edit={edit}
      />
      <ViewTournament id={id} open={openView} onClose={handleCloseView} />
      <RemoveTournament id={id} open={openRemove} onClose={handleCloseRemove} />
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        onCellClick={(params: any) => {
          if (params.field !== "actions") handleOpenView(params.id)
        }}
        getRowClassName={() => styles.row}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 20,
            },
          },
          filter: {
            filterModel: {
              items: [],
              quickFilterExcludeHiddenColumns: true,
            },
          },
        }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
          },
        }}
        columnVisibilityModel={{
          id: false,
        }}
        slots={{
          toolbar: () => (
            <TournamentGridToolbar action={() => handleOpenForm(false)} />
          ),
          loadingOverlay: () => <LinearProgress />,
        }}
        pageSizeOptions={[20, 50, 100]}
        disableRowSelectionOnClick
      />
    </Box>
  )
}
