import { useEffect, useReducer, useState } from "react"
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
  Typography,
  Grid,
  MenuItem,
  Select,
  Divider,
  Autocomplete,
  createFilterOptions,
  Tooltip,
  Stack,
  Checkbox,
  FormControlLabel,
} from "@mui/material"
import {
  DataGrid,
  GridColDef,
  GridRowSelectionModel,
  GridToolbarContainer,
  GridToolbarFilterButton,
  GridToolbarQuickFilter,
} from "@mui/x-data-grid"
import {
  Delete,
  Edit,
  AddCircle as Add,
  Workspaces,
  List as ListIcon,
} from "@mui/icons-material"
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
  writeBatch,
} from "firebase/firestore"
import { DB } from "../api/firebase"
import { LoadingButton } from "@mui/lab"
import {
  AddTournamentProps,
  DialogProps,
  ToolbarProps,
} from "../interfaces/props"
import {
  InitialPlayerState,
  PlayerReducer,
  TournamentJoined,
} from "../reducers/player"
import { PageLoader } from "../components/ui/Loading"
import { useNotifStore } from "../store/notif"
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import moment from "moment"
import styles from "../styles/datagrid.module.css"
import { useOptionStore } from "../store/option"
import { useAuthStore } from "../store/auth"

const PlayerGridToolbar = ({ action, rows, actionForRows }: ToolbarProps) => {
  return (
    <GridToolbarContainer
      sx={{ display: "flex", justifyContent: "space-between", p: 1 }}
    >
      <Box>
        <GridToolbarQuickFilter />
        <GridToolbarFilterButton />
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
        }}
      >
        {!!(actionForRows && rows.length > 0) && (
          <Button
            size="small"
            variant="contained"
            color="warning"
            startIcon={<Workspaces fontSize="inherit" />}
            onClick={() => actionForRows()}
          >
            Batch Level Players
          </Button>
        )}
        <Button
          size="small"
          variant="contained"
          startIcon={<Add fontSize="inherit" />}
          onClick={() => action()}
        >
          Add Player
        </Button>
      </Box>
    </GridToolbarContainer>
  )
}

const PlayerForm = ({ id, edit, open, onClose }: DialogProps) => {
  const { user } = useAuthStore((state) => state)
  const { showNotif } = useNotifStore((state) => state)
  const [payload, dispatch] = useReducer(PlayerReducer, InitialPlayerState)
  const { personal_details, player_details, history } = payload
  // Form
  const [loading, setLoading] = useState<boolean>(false)
  const [errors, setErrors] = useState<any>(null)
  // Options
  const { countries, levels, provinces, municipalities, barangays } =
    useOptionStore((state) => state)
  const [clubs, setClubs] = useState<any[]>([])
  // Filter
  const filter = createFilterOptions()
  // Level History Count
  const [levelUpdateLength, setLevelUpdateLength] = useState<number>(0)

  useEffect(() => {
    if (id) {
      const fetch = async () => {
        setLoading(true)
        try {
          const ref = doc(DB, `players/${id}`)
          const snapshot = await getDoc(ref)

          if (snapshot.exists()) {
            const data = snapshot.data()
            for (const key in data) {
              if (key in InitialPlayerState) {
                const updated = { ...data[key] }
                if (key === "personal_details" && "birth_date" in updated) {
                  updated.birth_date = moment
                    .unix(updated.birth_date.seconds)
                    .toDate()
                }
                if (key === "history" && "level_updates" in updated) {
                  setLevelUpdateLength(updated.level_updates.length)
                }
                set(key, updated)
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

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const ref = collection(DB, "clubs")
        onSnapshot(query(ref, orderBy("name", "asc")), {
          next: (snapshot) => {
            setClubs(
              snapshot.docs.map((doc: any) => {
                const { name } = doc.data()
                return {
                  label: name,
                  value: name,
                }
              })
            )
            setLoading(false)
          },
        })
      } catch (error: any) {
        console.error("Error Loading Data: " + error)
      }
    }
    const new_update = {
      date: new Date(),
      leveller: user?.displayName,
      new_level: "",
    }
    dispatch({
      type: "SET_FIELD",
      field: "history",
      value: {
        ...history,
        ["level_updates"]: [new_update],
      },
    })

    fetch()
  }, [])

  const set = (field: string, value: any) => {
    setErrors((prev: any) => {
      return { ...prev, [field]: "" }
    })
    const fields = field.split(".")
    switch (fields.length) {
      case 3:
        const [object, attribute, sub_attribute] = fields
        dispatch({
          type: "SET_FIELD",
          field: object,
          value: {
            ...payload[object],
            [attribute]: {
              ...payload[object][attribute],
              [sub_attribute]: value,
            },
          },
        })
        break
      case 2:
        const [obj, att] = fields
        if (att === "level") {
          const new_update = {
            date: new Date(),
            leveller: user?.displayName,
            new_level: value,
          }
          const updated_levels = edit ? [...history.level_updates] : []
          if (edit) updated_levels[levelUpdateLength] = new_update
          dispatch({
            type: "SET_FIELD",
            field: "history",
            value: {
              ...history,
              level_updates: edit ? updated_levels : [new_update],
            },
          })
          dispatch({
            type: "SET_FIELD",
            field: obj,
            value: { ...payload[obj], [att]: value },
          })
        } else if (att === "is_international") {
          if (value) {
            dispatch({
              type: "SET_FIELD",
              field: "personal_details",
              value: {
                ...personal_details,
                [att]: value,
                ["birth_address"]: {
                  address: "",
                  barangay: "",
                  municipality: "",
                  province: "",
                },
              },
            })
          } else {
            dispatch({
              type: "SET_FIELD",
              field: "personal_details",
              value: {
                ...personal_details,
                [att]: value,
                ["international_address"]: {
                  address: "",
                  country: "",
                },
              },
            })
          }
        } else {
          dispatch({
            type: "SET_FIELD",
            field: obj,
            value: { ...payload[obj], [att]: value },
          })
        }
        break
      default:
        dispatch({ type: "SET_FIELD", field, value })
        break
    }
  }

  const validate = () => {
    let newErrors: any = {}
    const defaultMessage = "This field is required."

    if (!(personal_details.first_name && personal_details.first_name.trim())) {
      newErrors["personal_details.first_name"] = defaultMessage
      dispatch({
        type: "SET_FIELD",
        field: "personal_details.first_name",
        value: "",
      })
    }
    if (!(personal_details.last_name && personal_details.last_name.trim())) {
      newErrors["personal_details.last_name"] = defaultMessage
      dispatch({
        type: "SET_FIELD",
        field: "personal_details.last_name",
        value: "",
      })
    }
    if (!(personal_details.gender && personal_details.gender.trim())) {
      newErrors["personal_details.gender"] = defaultMessage
      dispatch({
        type: "SET_FIELD",
        field: "personal_details.gender",
        value: "",
      })
    }
    if (
      !(
        personal_details.birth_address.address &&
        personal_details.birth_address.address.trim()
      ) &&
      !personal_details.is_international
    ) {
      newErrors["personal_details.birth_address.address"] = defaultMessage
      dispatch({
        type: "SET_FIELD",
        field: "personal_details.birth_address.address",
        value: "",
      })
    }
    if (
      !(
        personal_details.birth_address.province &&
        personal_details.birth_address.province.trim()
      ) &&
      !personal_details.is_international
    ) {
      newErrors["personal_details.birth_address.province"] = defaultMessage
      dispatch({
        type: "SET_FIELD",
        field: "personal_details.birth_address.province",
        value: "",
      })
    }
    if (
      !(
        personal_details.international_address.address &&
        personal_details.international_address.address.trim()
      ) &&
      personal_details.is_international
    ) {
      newErrors["personal_details.international_address.address"] =
        defaultMessage
      dispatch({
        type: "SET_FIELD",
        field: "personal_details.international_address.address",
        value: "",
      })
    }
    if (
      !(
        personal_details.international_address.country &&
        personal_details.international_address.country.trim()
      ) &&
      personal_details.is_international
    ) {
      newErrors["personal_details.international_address.country"] =
        defaultMessage
      dispatch({
        type: "SET_FIELD",
        field: "personal_details.international_address.country",
        value: "",
      })
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const update = async (player_id: any) => {
    if (!validate()) return
    setLoading(true)
    try {
      await updateDoc(doc(DB, `players/${player_id}`), payload)
      await addDoc(collection(DB, "history"), {
        created_at: serverTimestamp(),
        user: user?.displayName,
        action: `updated details of player, ${personal_details.first_name} ${personal_details.last_name}.`,
      })
      showNotif("Player updated successfully!", "success")
      close()
    } catch (error: unknown) {
      console.error("Error updating document:", error)
    } finally {
      setLoading(false)
    }
  }

  const submit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      if (
        !clubs.some((club) => player_details.club === club.value) &&
        player_details.club !== ""
      ) {
        await addDoc(collection(DB, "clubs"), {
          created_at: serverTimestamp(),
          name: player_details.club,
        })
        await addDoc(collection(DB, "history"), {
          created_at: serverTimestamp(),
          user: user?.displayName,
          action: `added new club, ${player_details.club}.`,
        })
      }
      await addDoc(collection(DB, "players"), {
        created_at: serverTimestamp(),
        ...payload,
      })
      await addDoc(collection(DB, "history"), {
        created_at: serverTimestamp(),
        user: user?.displayName,
        action: `added new player, ${personal_details.first_name} ${personal_details.last_name}.`,
      })
      showNotif("Player added successfully!", "success")
      close()
    } catch (error: unknown) {
      console.error("Error submitting document:", error)
    } finally {
      setLoading(false)
    }
  }

  const enter = (event: any) => {
    if (event.key == "Enter" && id) {
      edit ? update(id) : submit()
    }
  }

  const close = () => {
    onClose()
    setTimeout(() => {
      dispatch({ type: "RESET_FIELDS" })
      setErrors(null)
    }, 175)
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
            {edit
              ? `Update Player: ${personal_details.first_name} ${personal_details.last_name}`
              : "Add Player"}
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
                <Divider sx={{ mb: 1 }}>Bio</Divider>
              </Grid>
              <Grid item xs={6}>
                <FormControl
                  required
                  error={!!errors?.["personal_details.first_name"]}
                  sx={{ gap: 1 }}
                  fullWidth
                >
                  <FormLabel>First Name</FormLabel>
                  <TextField
                    id="first_name"
                    label=""
                    placeholder="Enter Player First Name"
                    value={personal_details.first_name}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      set("personal_details.first_name", event.target.value)
                    }
                    onKeyDown={enter}
                    error={!!errors?.["personal_details.first_name"]}
                    helperText={
                      !!errors?.["personal_details.first_name"] &&
                      errors["personal_details.first_name"]
                    }
                  />
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl
                  required
                  error={!!errors?.["personal_details.gender"]}
                  sx={{ gap: 1 }}
                  fullWidth
                >
                  <FormLabel>Gender</FormLabel>
                  <Select
                    displayEmpty
                    MenuProps={{
                      PaperProps: { sx: { maxHeight: 260 } },
                    }}
                    id={"gender"}
                    value={personal_details.gender}
                    onChange={(event) =>
                      set("personal_details.gender", event.target.value)
                    }
                    error={!!errors?.["personal_details.gender"]}
                  >
                    <MenuItem disabled value="">
                      <Typography variant="inherit" color="#c0c0c0">
                        Select Gender
                      </Typography>
                    </MenuItem>
                    <MenuItem value={"male"}>Male</MenuItem>
                    <MenuItem value={"female"}>Female</MenuItem>
                  </Select>
                  <FormHelperText sx={{ my: -0.75 }}>
                    {!!errors?.["personal_details.gender"] &&
                      errors["personal_details.gender"]}
                  </FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl sx={{ gap: 1 }} fullWidth>
                  <FormLabel>Middle Name</FormLabel>
                  <TextField
                    id="middle_name"
                    label=""
                    placeholder="Enter Player Middle Name (Optional)"
                    value={personal_details.middle_name}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      set("personal_details.middle_name", event.target.value)
                    }
                    onKeyDown={enter}
                  />
                  <FormHelperText></FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <FormControl required fullWidth sx={{ gap: 1 }}>
                    <FormLabel>Birthday</FormLabel>
                    <DatePicker
                      label=""
                      value={moment(personal_details.birth_date)}
                      onChange={(value) =>
                        set(
                          "personal_details.birth_date",
                          moment(value).toDate()
                        )
                      }
                    />
                    <FormHelperText></FormHelperText>
                  </FormControl>
                </LocalizationProvider>
              </Grid>
              <Grid item xs={6}>
                <FormControl
                  required
                  error={!!errors?.["personal_details.last_name"]}
                  sx={{ gap: 1 }}
                  fullWidth
                >
                  <FormLabel>Last Name</FormLabel>
                  <TextField
                    id="last_name"
                    label=""
                    value={personal_details.last_name}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      set("personal_details.last_name", event.target.value)
                    }
                    onKeyDown={enter}
                    placeholder="Enter Player Last Name"
                    error={!!errors?.["personal_details.last_name"]}
                    helperText={
                      !!errors?.["personal_details.last_name"] &&
                      errors["personal_details.last_name"]
                    }
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }}>Contact</Divider>
              </Grid>
              <Grid item xs={6}>
                <FormControl sx={{ gap: 1 }} fullWidth>
                  <FormLabel>Email</FormLabel>
                  <TextField
                    id="email"
                    label=""
                    type="email"
                    value={personal_details.email}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      set("personal_details.email", event.target.value)
                    }
                    placeholder="Enter Player Email (Optional)"
                    onKeyDown={enter}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl sx={{ gap: 1 }} fullWidth>
                  <FormLabel>Contact No.</FormLabel>
                  <TextField
                    id="contact_no"
                    label=""
                    value={personal_details.contact_no}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      set("personal_details.contact_no", event.target.value)
                    }
                    placeholder="Enter Player contact No. (Optional)"
                    onKeyDown={enter}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  sx={{ px: 3 }}
                  control={
                    <Checkbox
                      checked={personal_details?.is_international ?? false}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                        set(
                          "personal_details.is_international",
                          event.target.checked
                        )
                      }
                    />
                  }
                  label="International Player?"
                />
              </Grid>
              {!!personal_details?.is_international ? (
                <>
                  <Grid item xs={8}>
                    <FormControl
                      required
                      error={
                        !!errors?.[
                        "personal_details.international_address.address"
                        ]
                      }
                      sx={{ gap: 1 }}
                      fullWidth
                    >
                      <FormLabel>Address</FormLabel>
                      <TextField
                        id="contact_no"
                        label=""
                        value={personal_details.international_address.address}
                        onChange={(
                          event: React.ChangeEvent<HTMLInputElement>
                        ) =>
                          set(
                            "personal_details.international_address.address",
                            event.target.value
                          )
                        }
                        placeholder="Enter International Address"
                        onKeyDown={enter}
                        error={
                          !!errors?.[
                          "personal_details.international_address.address"
                          ]
                        }
                        helperText={
                          !!errors?.[
                          "personal_details.international_address.address"
                          ] &&
                          errors[
                          "personal_details.international_address.address"
                          ]
                        }
                      />
                    </FormControl>
                  </Grid>
                  <Grid item xs={4}>
                    <FormControl
                      required
                      error={
                        !!errors?.[
                        `personal_details.international_address.country`
                        ]
                      }
                      sx={{ gap: 1 }}
                      fullWidth
                    >
                      <FormLabel>Country</FormLabel>
                      <Select
                        displayEmpty
                        MenuProps={{ PaperProps: { sx: { maxHeight: 260 } } }}
                        id="province"
                        value={personal_details.international_address.country}
                        onChange={(event) =>
                          set(
                            "personal_details.international_address.country",
                            event.target.value
                          )
                        }
                        error={
                          !!errors?.[
                          `personal_details.international_address.country`
                          ]
                        }
                      >
                        <MenuItem disabled value="">
                          <Typography variant="inherit" color="#c0c0c0">
                            Select Province
                          </Typography>
                        </MenuItem>
                        {countries.map((country: any, index: number) => (
                          <MenuItem key={index} value={country.name}>
                            {country.name}
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText sx={{ mt: -0.75 }}>
                        {!!errors?.[
                          "personal_details.international_address.country"
                        ] &&
                          errors[
                          "personal_details.international_address.country"
                          ]}
                      </FormHelperText>
                    </FormControl>
                  </Grid>
                </>
              ) : (
                <>
                  <Grid item xs={12}>
                    <FormControl
                      required
                      error={
                        !!errors?.["personal_details.birth_address.address"]
                      }
                      sx={{ gap: 1 }}
                      fullWidth
                    >
                      <FormLabel>Address</FormLabel>
                      <TextField
                        id="address"
                        label=""
                        value={personal_details.birth_address.address}
                        onChange={(
                          event: React.ChangeEvent<HTMLInputElement>
                        ) =>
                          set(
                            "personal_details.birth_address.address",
                            event.target.value
                          )
                        }
                        onKeyDown={enter}
                        placeholder="Enter Player Address"
                        error={
                          !!errors?.["personal_details.birth_address.address"]
                        }
                        helperText={
                          !!errors?.[
                          "personal_details.birth_address.address"
                          ] && errors["personal_details.birth_address.address"]
                        }
                      />
                    </FormControl>
                  </Grid>
                  <Grid item xs={4}>
                    <FormControl
                      required
                      error={
                        !!errors?.[`personal_details.birth_address.province`]
                      }
                      sx={{ gap: 1 }}
                      fullWidth
                    >
                      <FormLabel>Province</FormLabel>
                      <Select
                        displayEmpty
                        MenuProps={{ PaperProps: { sx: { maxHeight: 260 } } }}
                        id="province"
                        value={personal_details.birth_address.province}
                        onChange={(event) =>
                          set(
                            "personal_details.birth_address.province",
                            event.target.value
                          )
                        }
                        error={
                          !!errors?.[`personal_details.birth_address.province`]
                        }
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
                      <FormHelperText sx={{ mt: -0.75 }}>
                        {!!errors?.[
                          "personal_details.birth_address.province"
                        ] && errors["personal_details.birth_address.province"]}
                      </FormHelperText>
                    </FormControl>
                  </Grid>
                  <Grid item xs={4}>
                    <FormControl
                      sx={{ gap: 1 }}
                      disabled={
                        !personal_details.birth_address.province ||
                        municipalities.filter(
                          (municipality: any) =>
                            personal_details.birth_address.province.toLowerCase() ==
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
                        value={personal_details.birth_address.municipality}
                        onChange={(event) =>
                          set(
                            "personal_details.birth_address.municipality",
                            event.target.value
                          )
                        }
                      >
                        <MenuItem disabled value="">
                          <Typography variant="inherit" color="#c0c0c0">
                            Select Municipality/City
                          </Typography>
                        </MenuItem>
                        {personal_details.birth_address.province &&
                          municipalities
                            .filter(
                              (municipality: any) =>
                                personal_details.birth_address.province.toLowerCase() ==
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
                      disabled={!personal_details.birth_address.municipality}
                      fullWidth
                    >
                      <FormLabel>Barangay</FormLabel>
                      <Select
                        displayEmpty
                        MenuProps={{ PaperProps: { sx: { maxHeight: 260 } } }}
                        id="barangay"
                        value={personal_details.birth_address.barangay}
                        onChange={(event) =>
                          set(
                            "personal_details.birth_address.barangay",
                            event.target.value
                          )
                        }
                      >
                        <MenuItem disabled value="">
                          <Typography variant="inherit" color="#c0c0c0">
                            Select Barangay
                          </Typography>
                        </MenuItem>
                        {personal_details.birth_address.municipality &&
                          barangays
                            .filter((barangay: any) =>
                              barangay.citymun
                                .toLowerCase()
                                .includes(
                                  personal_details.birth_address.municipality.toLowerCase()
                                )
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
                </>
              )}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }}>Player</Divider>
              </Grid>
              <Grid item xs={6}>
                <FormControl sx={{ gap: 1 }} fullWidth>
                  <FormLabel>Club</FormLabel>
                  <Autocomplete
                    value={player_details.club}
                    onChange={(_, selected: any) => {
                      if (selected && typeof selected === "object") {
                        set("player_details.club", selected.value)
                      } else if (selected && typeof selected === "string") {
                        set("player_details.club", selected)
                      } else {
                        set("player_details.club", "")
                      }
                    }}
                    filterOptions={(options, params) => {
                      const filtered = filter(options, params)
                      const { inputValue: value } = params

                      if (
                        value &&
                        !clubs.some((club) => value === club.value)
                      ) {
                        filtered.push({
                          value,
                          label: value,
                        })
                      }

                      return filtered
                    }}
                    id="club"
                    options={clubs}
                    freeSolo
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Enter Club Name (Optional)"
                      />
                    )}
                  />

                  <FormHelperText>
                    If the club isn't in the options, just type the player's
                    club name. If the player is clubless, leave it blank.
                  </FormHelperText>
                </FormControl>
              </Grid>
              {!edit && (
                <Grid item xs={6}>
                  <FormControl sx={{ gap: 1 }} fullWidth>
                    <FormLabel>Player Level</FormLabel>
                    <Select
                      displayEmpty
                      MenuProps={{
                        PaperProps: { sx: { maxHeight: 260 } },
                      }}
                      id="level"
                      value={player_details.level}
                      onChange={(event) =>
                        set("player_details.level", event.target.value)
                      }
                    >
                      <MenuItem value="">Unassigned</MenuItem>
                      {levels.map((level: any, index: number) => (
                        <MenuItem key={index} value={level}>
                          {level}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText></FormHelperText>
                  </FormControl>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <LoadingButton
              loading={loading}
              variant="contained"
              onClick={edit ? () => update(id) : submit}
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

const AddTournamentForm = ({
  id,
  open,
  onClose,
  add,
  gender,
}: AddTournamentProps) => {
  const { user } = useAuthStore(state => state)
  const [loading, setLoading] = useState<boolean>(false)
  const [tournament, setTournament] = useState<any>({
    tournament: "",
    event: "",
    standing: "",
    partner_id: "",
  })
  // Options
  const [availableTournaments, setAvailableTournaments] = useState<any[]>([])
  const [tournamentsJoined, setTournamentsJoined] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const { standings } = useOptionStore((state) => state)
  const [players, setPlayers] = useState<any[]>([])
  const [errors, setErrors] = useState<any>(null)
  const [formLoading, setFormLoading] = useState<boolean>(false)

  useEffect(() => {
    if (id) {
      const fetch = async () => {
        setLoading(true)
        try {
          const tournamentsRef = collection(DB, "tournaments")
          const playersRef = collection(DB, "players")
          const playerDocRef = doc(DB, `players/${id}`)

          const unsubscribeTournaments = onSnapshot(
            query(tournamentsRef, orderBy("name", "asc")),
            (snapshot) => {
              setAvailableTournaments(snapshot.docs.map((doc) => doc.data()))
            }
          )

          const unsubscribePlayers = onSnapshot(playersRef, (snapshot) => {
            setPlayers(
              snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }))
            )
          })

          const unsubscribePlayer = onSnapshot(playerDocRef, (snapshot) => {
            if (snapshot.exists()) {
              setTournamentsJoined(snapshot.data().history.tournaments_joined)
            }
          })

          return () => {
            unsubscribeTournaments()
            unsubscribePlayers()
            unsubscribePlayer()
          }
        } catch (error: any) {
          console.error("Error Loading Data: " + error)
        } finally {
          setLoading(false)
        }
      }

      fetch()
    }
  }, [id])

  useEffect(() => {
    if (tournament.tournament) {
      const selectedTournament = availableTournaments.find(
        (t) => t.name === tournament.tournament
      )
      if (selectedTournament) {
        setEvents(selectedTournament.events || [])
      }
    }
  }, [tournament.tournament, availableTournaments])

  const set = (field: string, value: any) => {
    setErrors((prev: any) => {
      return { ...prev, [field]: "" }
    })
    setTournament((prev: any) => {
      const updatedTournament: any = { ...prev }
      if (field === "tournament") {
        updatedTournament.event = ""
      }
      updatedTournament[field] = value
      return updatedTournament
    })
  }

  const validate = () => {
    let newErrors: any = {}
    const defaultMessage = "This field is required."

    if (!(tournament.tournament && tournament.tournament.trim())) {
      newErrors.tournament = defaultMessage
      set("tournament", "")
    }
    if (!(tournament.event && tournament.event.trim())) {
      newErrors.event = defaultMessage
      set("event", "")
    }
    if (!(tournament.standing && tournament.standing.trim())) {
      newErrors.standing = defaultMessage
      set("standing", "")
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const submit = async () => {
    if (!validate()) return
    if (tournament.partner_id !== "") {
      try {
        setFormLoading(true)
        const ref = doc(DB, `players/${tournament.partner_id}`)
        const snap = await getDoc(ref)
        if (snap.exists()) {
          const { personal_details, player_details, history } = snap.data()
          const { level_updates, tournaments_joined } = history
          const updatedTournaments = [...tournaments_joined]
          updatedTournaments.push({
            tournament: tournament.tournament,
            event: tournament.event,
            standing: tournament.standing,
            partner_id: id,
          })
          const payload = {
            personal_details,
            player_details,
            history: {
              level_updates,
              tournaments_joined: updatedTournaments,
            },
          }
          await updateDoc(doc(DB, `players/${tournament.partner_id}`), payload)
          await addDoc(collection(DB, "history"), {
            created_at: serverTimestamp(),
            user: user?.displayName,
            action: `updated tournament history of ${personal_details.first_name} ${personal_details.last_name}.`,
          })
        }
      } catch (error: unknown) {
        console.error("Error updating document:", error)
      } finally {
        setFormLoading(false)
      }
    }
    if (add) {
      add(tournament)
      close()
    }
  }

  const close = () => {
    setTournament({
      tournament: "",
      event: "",
      standing: "",
      partner_id: "",
    })
    setTournamentsJoined([])
    setErrors(null)
    onClose()
  }

  return (
    <Backdrop sx={{ zIndex: 2 }} open={open}>
      {loading ? (
        <PageLoader />
      ) : (
        <Dialog open={open} onClose={close} maxWidth="sm" fullWidth>
          <DialogTitle>Add Tournament</DialogTitle>
          <DialogContent>
            <Stack gap={1}>
              <FormControl
                required
                error={!!errors?.tournament}
                sx={{ gap: 1 }}
                fullWidth
              >
                <FormLabel>Tournament</FormLabel>
                <Select
                  displayEmpty
                  MenuProps={{
                    PaperProps: { sx: { maxHeight: 260 } },
                  }}
                  id="tournament"
                  value={tournament.tournament}
                  onChange={(event) => set("tournament", event.target.value)}
                  error={!!errors?.tournament}
                >
                  <MenuItem disabled value="">
                    <Typography variant="inherit" color="#c0c0c0">
                      Select Tournament
                    </Typography>
                  </MenuItem>
                  {availableTournaments.map(
                    (tournament: any, index: number) => (
                      <MenuItem key={index} value={tournament.name}>
                        {tournament.name}
                      </MenuItem>
                    )
                  )}
                </Select>
                <FormHelperText sx={{ mt: -0.75 }}>
                  {!!errors?.tournament && errors.tournament}
                </FormHelperText>
              </FormControl>
              <FormControl
                required
                error={!!errors?.event}
                disabled={!tournament.tournament}
                sx={{ gap: 1 }}
                fullWidth
              >
                <FormLabel>Event</FormLabel>
                <Select
                  displayEmpty
                  MenuProps={{
                    PaperProps: { sx: { maxHeight: 260 } },
                  }}
                  id="event"
                  value={tournament.event}
                  onChange={(event) => set("event", event.target.value)}
                  error={!!errors?.event}
                >
                  <MenuItem disabled value="">
                    <Typography variant="inherit" color="#c0c0c0">
                      Select Event
                    </Typography>
                  </MenuItem>
                  {events
                    .filter(
                      (event) =>
                        event.gender == gender ||
                        event.gender == "mixed" ||
                        event.gender == "non-mixed"
                    )
                    .map((event: any, index: number) => (
                      <MenuItem key={index} value={event.name}>
                        {event.name}
                      </MenuItem>
                    ))}
                </Select>
                <FormHelperText sx={{ mt: -0.75 }}>
                  {!!errors?.event && errors.event}
                </FormHelperText>
              </FormControl>
              <FormControl
                required
                error={!!errors?.standing}
                sx={{ gap: 1 }}
                fullWidth
              >
                <FormLabel>Standing</FormLabel>
                <Select
                  displayEmpty
                  MenuProps={{
                    PaperProps: { sx: { maxHeight: 260 } },
                  }}
                  id="standing"
                  value={tournament.standing}
                  onChange={(event) => set("standing", event.target.value)}
                  error={!!errors?.standing}
                >
                  <MenuItem disabled value="">
                    <Typography variant="inherit" color="#c0c0c0">
                      Select Standing
                    </Typography>
                  </MenuItem>
                  {standings.map((standing: any, index: number) => (
                    <MenuItem key={index} value={standing}>
                      {standing}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText sx={{ mt: -0.75 }}>
                  {!!errors?.standing && errors.standing}
                </FormHelperText>
              </FormControl>
              <FormControl sx={{ gap: 1 }} fullWidth>
                <FormLabel>Partner (if any)</FormLabel>
                <Select
                  displayEmpty
                  disabled={!tournament.event}
                  MenuProps={{
                    PaperProps: { sx: { maxHeight: 260 } },
                  }}
                  id="event"
                  value={tournament.partner_id}
                  onChange={(event) => set("partner_id", event.target.value)}
                >
                  <MenuItem disabled value="">
                    <Typography variant="inherit" color="#c0c0c0">
                      Select Partner
                    </Typography>
                  </MenuItem>
                  {players
                    .filter(
                      (player) =>
                        player.id != id &&
                        player.id !=
                        tournamentsJoined?.find(
                          (t) => t.event == tournament.event
                        )?.partner_id
                    )
                    .sort((prev, next) =>
                      prev.personal_details.last_name.localeCompare(
                        next.personal_details.last_name
                      )
                    )
                    .map((player: any, index: number) => (
                      <MenuItem
                        key={index}
                        value={player.id}
                        sx={{ display: "flex", gap: 0.5 }}
                      >
                        <Typography variant="inherit" color="inherit">
                          {`${player.personal_details.last_name}, ${player.personal_details.first_name
                            }${player.player_details.club !== ""
                              ? " - " + player.player_details.club
                              : ""
                            }`}
                        </Typography>
                      </MenuItem>
                    ))}
                </Select>
                <FormHelperText></FormHelperText>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <LoadingButton
              loading={formLoading}
              variant="contained"
              onClick={submit}
            >
              Add
            </LoadingButton>
            <LoadingButton loading={formLoading} color="error" onClick={close}>
              Close
            </LoadingButton>
          </DialogActions>
        </Dialog>
      )}
    </Backdrop>
  )
}

const HistoryForm = ({ id, open, onClose }: DialogProps) => {
  const { user } = useAuthStore((state) => state)
  const { showNotif } = useNotifStore((state) => state)
  const [payload, dispatch] = useReducer(PlayerReducer, InitialPlayerState)
  const { personal_details, player_details, history } = payload
  // Tables
  const [tableLoading, setTableLoading] = useState<boolean>(false)
  const [levelRows, setLevelRows] = useState<any[]>([])
  const [tournamentRows, setTournamentRows] = useState<any[]>([])
  // Form
  const [loading, setLoading] = useState<boolean>(true)
  // Options
  const { levels } = useOptionStore((state) => state)
  const [players, setPlayers] = useState<any[]>([])
  // Array Lengths
  const [levelUpdateLength, setLevelUpdateLength] = useState<number>(0)
  // Sub-Dialogs
  const [openAddTournament, setOpenAddTournament] = useState<boolean>(false)
  // Do Update
  const [doUpdate, setDoUpdate] = useState<boolean>(false)
  const [updatingLevel, setUpdatingLevel] = useState<boolean>(false)

  useEffect(() => {
    if (id && players.length > 0) {
      const fetch = async () => {
        setLoading(true)
        setTableLoading(true)
        try {
          const ref = doc(DB, `players/${id}`)
          onSnapshot(ref, {
            next: (snapshot) => {
              if (snapshot.exists()) {
                const data = snapshot.data()
                for (const key in data) {
                  if (key in InitialPlayerState) {
                    const updated = { ...data[key] }
                    if (key === "history") {
                      setLevelUpdateLength(updated.level_updates.length)
                    }
                    set(key, data[key])
                  }
                }
                setLevelRows(
                  data.history.level_updates.map(
                    (update: any, index: number) => {
                      return {
                        id: index,
                        date:
                          "seconds" in update.date
                            ? moment.unix(update.date.seconds).format("LLL")
                            : moment(update.date).format("LLL"),
                        leveller: update.leveller,
                        new_level: update.new_level,
                      }
                    }
                  )
                )
                setTournamentRows(
                  data.history.tournaments_joined.map(
                    (tournament: any, index: number) => {
                      return {
                        id: index,
                        tournament: tournament.tournament,
                        event: tournament.event,
                        partner: tournament.partner_id
                          ? `${players.find(
                            (player) => player.id === tournament.partner_id
                          )?.personal_details.first_name
                          } ${players.find(
                            (player) => player.id === tournament.partner_id
                          )?.personal_details.last_name
                          }`
                          : "None",
                        standing: tournament.standing,
                        actions: { index },
                      }
                    }
                  )
                )
              }
            },
          })
        } catch (error: unknown) {
          console.error(error)
        } finally {
          setLoading(false)
          setTableLoading(false)
        }
      }

      fetch()
    }

    return () => {
      setLevelRows([])
      setTournamentRows([])
      dispatch({ type: "RESET_FIELDS" })
    }
  }, [id, players])

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const ref = collection(DB, "players")
        onSnapshot(ref, {
          next: (snapshot) => {
            setPlayers(
              snapshot.docs.map((doc: any) => {
                return {
                  id: doc.id,
                  ...doc.data(),
                }
              })
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

  useEffect(() => {
    if (doUpdate && id) {
      update(id)
    }
  }, [doUpdate, id])

  const levelColumns: GridColDef[] = [
    {
      field: "id",
      headerName: "ID",
    },
    {
      field: "date",
      headerName: "Date Updated",
      width: 180,
    },
    {
      field: "leveller",
      headerName: "Leveller",
      flex: 1.75,
    },
    {
      field: "new_level",
      headerName: "Level",
      flex: 1,
      renderCell: (params: any) => {
        const level = params.value
        return (
          <Typography variant="inherit" textTransform="capitalize">
            {!!level ? level : "Unassigned"}
          </Typography>
        )
      },
    },
  ]

  const tournamentColumns: GridColDef[] = [
    {
      field: "id",
      headerName: "ID",
    },
    {
      field: "tournament",
      headerName: "Tournament",
      flex: 1.5,
    },
    {
      field: "event",
      headerName: "Event",
      flex: 1,
    },
    {
      field: "partner",
      headerName: "Partner",
      flex: 1,
    },
    {
      field: "standing",
      headerName: "Standing",
      flex: 1,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 75,
      renderCell: (params: any) => {
        const { index } = params.value
        return (
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={() => removeTournament(index)}
            >
              <Delete />
            </IconButton>
          </Tooltip>
        )
      },
    },
  ]

  const set = (field: string, value: any) => {
    const fields = field.split(".")
    switch (fields.length) {
      case 2:
        const [obj, att] = fields
        if (att === "level") {
          setUpdatingLevel(true)
          const new_update = {
            date: new Date(),
            leveller: user?.displayName,
            new_level: value,
          }
          const updated_levels = [...history.level_updates]
          updated_levels[levelUpdateLength] = new_update
          dispatch({
            type: "SET_FIELD",
            field: "history",
            value: {
              ...history,
              ["level_updates"]: updated_levels,
            },
          })
        }
        dispatch({
          type: "SET_FIELD",
          field: obj,
          value: { ...payload[obj], [att]: value },
        })
        break
      default:
        dispatch({ type: "SET_FIELD", field, value })
        break
    }
  }

  const addTournament = (tournament?: TournamentJoined) => {
    const updatedTournamentsJoined = [...history.tournaments_joined]
    updatedTournamentsJoined.push(tournament)
    dispatch({
      type: "SET_FIELD",
      field: "history",
      value: {
        ...history,
        ["tournaments_joined"]: updatedTournamentsJoined,
      },
    })
    setDoUpdate(true)
  }

  const removeTournament = async (index: number) => {
    try {
      const updatedTournamentsJoined = [...history.tournaments_joined]
      // Remove Tournament For Partner
      if (updatedTournamentsJoined[index].partner_id) {
        const tournamentToRemove = updatedTournamentsJoined[index]
        const partnerRef = doc(DB, `players/${tournamentToRemove.partner_id}`)
        const snapshot = await getDoc(partnerRef)
        if (snapshot.exists()) {
          const { personal_details, player_details, history } = snapshot.data()
          const { level_updates, tournaments_joined } = history
          const updatedTournaments = [...tournaments_joined]
          const indexToRemove = updatedTournaments.findIndex(
            (tournament) =>
              tournament.event === tournamentToRemove.event &&
              tournament.partner_id === id
          )
          updatedTournaments.splice(indexToRemove, 1)
          const payload = {
            personal_details,
            player_details,
            history: {
              level_updates,
              tournaments_joined: updatedTournaments,
            },
          }
          await updateDoc(
            doc(DB, `players/${tournamentToRemove.partner_id}`),
            payload
          )
          await addDoc(collection(DB, "history"), {
            created_at: serverTimestamp(),
            user: user?.displayName,
            action: `updated tournament history of player, ${personal_details.first_name} ${personal_details.last_name}.`,
          })
        }
      }
      updatedTournamentsJoined.splice(index, 1)
      dispatch({
        type: "SET_FIELD",
        field: "history",
        value: {
          ...history,
          ["tournaments_joined"]: updatedTournamentsJoined,
        },
      })
    } catch (error: any) {
      console.error(error)
    } finally {
      setDoUpdate(true)
    }
  }

  const update = async (update_id: any) => {
    setTableLoading(true)
    try {
      await updateDoc(doc(DB, `players/${update_id}`), payload)
      if (updatingLevel && player_details.level !== history?.level_updates[history.level_updates.length - 2]?.new_level) {
        await addDoc(collection(DB, "history"), {
          created_at: serverTimestamp(),
          user: user?.displayName,
          action: `updated player level of ${personal_details.first_name
            } ${personal_details.last_name} from ${!!history.level_updates[history.level_updates.length - 2]?.new_level
              ? history.level_updates[history.level_updates.length - 2]
                .new_level
              : "Unassigned"
            } to ${!!player_details.level ? player_details.level : "Unassigned"}.`,
        })
        setUpdatingLevel(false)
      } else {
        await addDoc(collection(DB, "history"), {
          created_at: serverTimestamp(),
          user: user?.displayName,
          action: `updated tournament history of ${personal_details.first_name} ${personal_details.last_name}.`,
        })
      }
      showNotif("Player updated successfully!", "success")
    } catch (error: unknown) {
      console.error("Error updating document:", error)
    } finally {
      setTableLoading(false)
      setDoUpdate(false)
    }
  }

  const handleOpenAddTournament = () => {
    setOpenAddTournament(true)
  }

  const handleCloseAddTournament = () => {
    setOpenAddTournament(false)
  }

  const close = () => {
    onClose()
    setTimeout(() => {
      setLevelRows([])
      setTournamentRows([])
      dispatch({ type: "RESET_FIELDS" })
    }, 175)
  }

  return (
    <Backdrop sx={{ zIndex: 1 }} open={open}>
      <AddTournamentForm
        id={id}
        open={openAddTournament}
        onClose={handleCloseAddTournament}
        add={addTournament}
        gender={personal_details.gender}
      />
      {loading ? (
        <PageLoader />
      ) : (
        <Dialog
          open={open}
          onClose={close}
          maxWidth="xl"
          hideBackdrop
          fullWidth
        >
          <DialogTitle>{`Update History: ${personal_details.first_name} ${personal_details.last_name}`}</DialogTitle>
          <DialogContent>
            <Grid container columnSpacing={2}>
              <Grid item xs={8}>
                <Grid container columnSpacing={2}>
                  <Grid item xs={9}>
                    <Box sx={{ height: 80, mb: 2.25 }}>
                      <Grid container rowGap={0.25}>
                        <Grid item xs={1.5}>
                          <Typography fontWeight={700}>Full Name</Typography>
                        </Grid>
                        <Grid item xs={4.5}>
                          <Typography>
                            {personal_details?.first_name}{" "}
                            {personal_details?.last_name}
                          </Typography>
                        </Grid>
                        <Grid item xs={1.5}>
                          <Typography fontWeight={700}>Age</Typography>
                        </Grid>
                        <Grid item xs={4.5}>
                          <Typography>
                            {moment().diff(
                              moment.unix(personal_details?.birth_date.seconds),
                              "years"
                            ) + " years old"}
                          </Typography>
                        </Grid>
                        <Grid item xs={1.5}>
                          <Typography fontWeight={700}>Gender</Typography>
                        </Grid>
                        <Grid item xs={4.5}>
                          <Typography textTransform="capitalize">
                            {personal_details?.gender}
                          </Typography>
                        </Grid>
                        <Grid item xs={1.5}>
                          <Typography fontWeight={700}>Club</Typography>
                        </Grid>
                        <Grid item xs={4.5}>
                          <Typography textTransform="capitalize">
                            {player_details?.club !== ""
                              ? player_details?.club
                              : "N/A"}
                          </Typography>
                        </Grid>
                        <Grid item xs={1.5}>
                          <Typography fontWeight={700}>Address</Typography>
                        </Grid>
                        <Grid item xs={10.5}>
                          <Typography textTransform="capitalize">
                            {`${Object.entries(personal_details.is_international ? personal_details.international_address : personal_details.birth_address)
                              .filter(([key, value]) => value)
                              .sort(([prev], [next]) =>
                                prev.localeCompare(next)
                              )
                              .map(([key, value]) => value)
                              .reverse()
                              .join(", ")}`}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  </Grid>
                  <Grid item xs={3}>
                    <Button
                      size="large"
                      sx={{ mt: 4, py: 1.8 }}
                      variant="contained"
                      onClick={handleOpenAddTournament}
                      fullWidth
                    >
                      Add Tournament
                    </Button>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ height: 400 }}>
                      <DataGrid
                        rows={tournamentRows}
                        columns={tournamentColumns}
                        loading={tableLoading}
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
                                No. of Tournaments:{" "}
                                <b>{tournamentRows.length}</b>
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
                                Oops! Player hasn't joined any tournaments.
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
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={4}>
                <Grid container columnSpacing={2} rowSpacing={1.25}>
                  <Grid item xs={7}>
                    <FormControl sx={{ gap: 1 }} fullWidth>
                      <FormLabel>Current Player Level</FormLabel>
                      <Select
                        displayEmpty
                        MenuProps={{
                          PaperProps: { sx: { maxHeight: 260 } },
                        }}
                        id="level"
                        value={player_details.level}
                        onChange={(event) =>
                          set("player_details.level", event.target.value)
                        }
                      >
                        <MenuItem value="">No Level</MenuItem>
                        {levels.map((level: any, index: number) => (
                          <MenuItem key={index} value={level}>
                            {level}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={5}>
                    <LoadingButton
                      size="large"
                      sx={{ mt: 4, py: 1.8 }}
                      loading={loading}
                      variant="contained"
                      onClick={() => update(id)}
                      fullWidth
                    >
                      Update Level
                    </LoadingButton>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ height: 400 }}>
                      <DataGrid
                        rows={levelRows}
                        columns={levelColumns}
                        loading={tableLoading}
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
                                No. of Updates: <b>{levelRows.length}</b>
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
                                Oops! There are no level updates.
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
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button color="error" onClick={close}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Backdrop>
  )
}

const ViewPlayer = ({ id, open, onClose }: DialogProps) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [data, setData] = useState<any>(null)
  const [levelRows, setLevelRows] = useState<any[]>([])
  const [tournamentRows, setTournamentRows] = useState<any[]>([])
  const [players, setPlayers] = useState<any[]>([])

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const ref = collection(DB, "players")
        onSnapshot(ref, {
          next: (snapshot) => {
            setPlayers(
              snapshot.docs.map((doc: any) => {
                return {
                  id: doc.id,
                  ...doc.data(),
                }
              })
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

  useEffect(() => {
    if (id) {
      const fetch = async () => {
        setLoading(true)
        try {
          const ref = doc(DB, `players/${id}`)
          const snapshot = await getDoc(ref)

          if (snapshot.exists()) {
            const data = snapshot.data()
            setData(data)
            setLevelRows(
              data.history.level_updates.map((update: any, index: number) => {
                return {
                  id: index,
                  date:
                    "seconds" in update.date
                      ? moment.unix(update.date.seconds).format("LLL")
                      : moment(update.date).format("LLL"),
                  leveller: update.leveller,
                  new_level: update.new_level,
                }
              })
            )
            setTournamentRows(
              data.history.tournaments_joined.map(
                (tournament: any, index: number) => {
                  return {
                    id: index,
                    tournament: tournament.tournament,
                    event: tournament.event,
                    partner: tournament.partner_id
                      ? `${players.find(
                        (player) => player.id === tournament.partner_id
                      )?.personal_details.first_name
                      } ${players.find(
                        (player) => player.id === tournament.partner_id
                      )?.personal_details.last_name
                      }`
                      : "None",
                    standing: tournament.standing,
                  }
                }
              )
            )
          }
        } catch (error: unknown) {
          console.error(error)
        } finally {
          setLoading(false)
        }
      }

      fetch()
    }
  }, [id])

  const levelColumns: GridColDef[] = [
    {
      field: "id",
      headerName: "ID",
    },
    {
      field: "date",
      headerName: "Date Updated",
      flex: 1,
    },
    {
      field: "leveller",
      headerName: "Leveller",
      flex: 1,
    },
    {
      field: "new_level",
      headerName: "Level",
      flex: 1,
      renderCell: (params: any) => {
        const level = params.value
        return (
          <Typography variant="inherit" textTransform="capitalize">
            {!!level ? level : "Unassigned"}
          </Typography>
        )
      },
    },
  ]

  const tournamentColumns: GridColDef[] = [
    {
      field: "id",
      headerName: "ID",
    },
    {
      field: "tournament",
      headerName: "Tournament",
      flex: 1.5,
    },
    {
      field: "event",
      headerName: "Event",
      flex: 1,
    },
    {
      field: "partner",
      headerName: "Partner",
      flex: 1,
    },
    {
      field: "standing",
      headerName: "Standing",
      flex: 1,
    },
  ]

  const close = () => {
    onClose()
    setTimeout(() => {
      setData(null)
    }, 175)
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
            View Player: {data?.personal_details?.first_name}{" "}
            {data?.personal_details?.last_name}
          </DialogTitle>
          <DialogContent sx={{ mt: -2 }}>
            <Grid container columnSpacing={2} rowSpacing={1}>
              <Grid item xs={12}>
                <Divider>Personal Details</Divider>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="subtitle2">First Name</Typography>
                <Typography variant="subtitle1" fontWeight={700}>
                  {data?.personal_details?.first_name}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="subtitle2">Middle Name</Typography>
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  color={
                    !!data?.personal_details?.middle_name ? "inherit" : "gray"
                  }
                >
                  {!!data?.personal_details?.middle_name
                    ? data?.personal_details?.middle_name
                    : "N/A"}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="subtitle2">Last Name</Typography>
                <Typography variant="subtitle1" fontWeight={700}>
                  {data?.personal_details?.last_name}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="subtitle2">Birthday (Age)</Typography>
                <Typography variant="subtitle1" fontWeight={700}>
                  {moment
                    .unix(data?.personal_details?.birth_date.seconds)
                    .format("LL")}{" "}
                  (
                  {moment().diff(
                    moment.unix(data?.personal_details?.birth_date.seconds),
                    "years"
                  ) + " years old"}
                  )
                </Typography>
              </Grid>
              <Grid item xs={8}>
                <Typography variant="body2">Birth Address</Typography>
                {!data?.personal_details?.is_international ? (
                  <>
                    {data?.personal_details?.birth_address && (
                      <Typography variant="body1" fontWeight={700}>
                        {`${Object.entries(
                          data?.personal_details?.birth_address
                        )
                          .filter(([key, value]) => value)
                          .sort(([prev], [next]) => prev.localeCompare(next))
                          .map(([key, value]) => value)
                          .reverse()
                          .join(", ")}`}
                      </Typography>
                    )}
                  </>
                ) : (
                  <>
                    {data?.personal_details?.international_address && (
                      <Typography variant="body1" fontWeight={700}>
                        {`${Object.entries(
                          data?.personal_details?.international_address
                        )
                          .filter(([key, value]) => value)
                          .sort(([prev], [next]) => prev.localeCompare(next))
                          .map(([key, value]) => value)
                          .reverse()
                          .join(", ")}`}
                      </Typography>
                    )}
                  </>
                )}
              </Grid>
              <Grid item xs={4}>
                <Typography variant="subtitle2">Contact Number</Typography>
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  color={
                    !!data?.personal_details?.contact_no ? "inherit" : "gray"
                  }
                >
                  {!!data?.personal_details?.contact_no
                    ? data?.personal_details?.contact_no
                    : "N/A"}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="subtitle2">Email</Typography>
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  color={!!data?.personal_details?.email ? "inherit" : "gray"}
                >
                  {!!data?.personal_details?.email
                    ? data?.personal_details?.email
                    : "N/A"}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Divider>Player History & Details</Divider>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="subtitle2">Current Level</Typography>
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  color={!!data?.player_details?.level ? "inherit" : "gray"}
                >
                  {!!data?.player_details?.level
                    ? data?.player_details?.level
                    : "Unassigned"}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="subtitle2">Club</Typography>
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  color={!!data?.player_details?.club ? "inherit" : "gray"}
                >
                  {!!data?.player_details?.club
                    ? data?.player_details?.club
                    : "No Club"}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Tournaments Joined</Typography>
                <Box sx={{ height: 200 }}>
                  <DataGrid
                    rows={tournamentRows}
                    columns={tournamentColumns}
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
                            No. of Tournaments Joined:{" "}
                            <b>{tournamentRows.length}</b>
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
                            Oops! Player hasn't joined any tournaments.
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
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">
                  Player Level History
                </Typography>
                <Box sx={{ height: 200 }}>
                  <DataGrid
                    rows={levelRows}
                    columns={levelColumns}
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
                            No. of Updates: <b>{levelRows.length}</b>
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
                            Oops! There are no level updates.
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
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <LoadingButton color="error" onClick={close}>
              Cancel
            </LoadingButton>
          </DialogActions>
        </Dialog>
      )}
    </Backdrop>
  )
}

const RemovePlayer = ({ id, open, onClose }: DialogProps) => {
  const { user } = useAuthStore((state) => state)
  const { showNotif } = useNotifStore((state) => state)
  const [loading, setLoading] = useState<boolean>(false)
  const [data, setData] = useState<any>()

  useEffect(() => {
    if (id) {
      const fetch = async () => {
        setLoading(true)
        try {
          const ref = doc(DB, `players/${id}`)
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
      await deleteDoc(doc(DB, `players/${id}`))
      await addDoc(collection(DB, "history"), {
        created_at: serverTimestamp(),
        user: user?.displayName,
        action: `deleted player, ${data.personal_details.first_name} ${data.personal_details.last_name}`,
      })
      showNotif("Player successfully deleted!", "success")
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
          <DialogTitle>
            Delete Player: {data?.personal_details?.first_name}{" "}
            {data?.personal_details?.last_name}
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Would you like to delete {data?.personal_details?.first_name}{" "}
              {data?.personal_details?.last_name}?
            </DialogContentText>
            <DialogContentText variant="caption" color="error">
              *This may affect other data relating to this player.
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

const BatchPlayers = ({ rows, open, onClose }: DialogProps) => {
  const { user } = useAuthStore((state) => state)
  const { showNotif } = useNotifStore((state) => state)
  const [loading, setLoading] = useState<boolean>(false)
  const [players, setPlayers] = useState<any[]>([])
  // Options
  const { levels } = useOptionStore((state) => state)
  // Level
  const [level, setLevel] = useState<string>("")

  useEffect(() => {
    if (rows.length > 0) {
      const fetch = async () => {
        setLoading(true)
        try {
          const ref = collection(DB, "players")
          onSnapshot(ref, {
            next: (snapshot) => {
              setPlayers(
                snapshot.docs
                  .filter((doc: any) => rows.includes(doc.id))
                  .map((doc: any) => {
                    const { personal_details, player_details } = doc.data()
                    return {
                      id: doc.id,
                      name: `${personal_details.last_name}, ${personal_details.first_name}`,
                      level: player_details.level,
                      club: player_details.club,
                    }
                  })
              )
              setLoading(false)
            },
          })
        } catch (error: any) {
        } finally {
          setLoading(false)
        }
      }
      fetch()
    }
  }, [rows])

  const playerColumns: GridColDef[] = [
    {
      field: "id",
      headerName: "ID",
    },
    {
      field: "name",
      headerName: "Name",
      flex: 1.5,
    },
    {
      field: "club",
      headerName: "Club",
      flex: 1,
      renderCell: (params) => {
        const club = params.value
        return (
          <Typography variant="inherit" color={!!club ? "inherit" : "GrayText"}>
            {!!club ? club : "N/A"}
          </Typography>
        )
      },
    },
    {
      field: "level",
      headerName: "Current Level",
      flex: 1,
      renderCell: (params) => {
        const level = params.value
        return (
          <Typography
            variant="inherit"
            color={!!level ? "inherit" : "GrayText"}
          >
            {!!level ? level : "Unassigned"}
          </Typography>
        )
      },
    },
  ]

  const batchUpdate = async (ids: string[]) => {
    setLoading(true)
    if (ids.length > 0) {
      try {
        const batch = writeBatch(DB)
        for (const id of ids) {
          const ref = doc(DB, `players/${id}`)
          const snapshot = await getDoc(ref)
          if (snapshot.exists()) {
            const data = snapshot.data()
            const updatedLevelUpdates = data.history.level_updates
            const newUpdate = {
              date: new Date(),
              leveller: user?.displayName,
              new_level: level,
            }
            await addDoc(collection(DB, "history"), {
              created_at: serverTimestamp(),
              user: user?.displayName,
              action: `updated player level of ${data.personal_details.first_name
                } ${data.personal_details.last_name} from ${!!updatedLevelUpdates[updatedLevelUpdates.length - 1].new_level
                  ? updatedLevelUpdates[updatedLevelUpdates.length - 1]
                    .new_level
                  : "Unassigned"
                } to ${!!level ? level : "Unassigned"}.`,
            })
            updatedLevelUpdates.push(newUpdate)
            const payload = {
              ...data,
              player_details: {
                ...data.player_details,
                level,
              },
              history: {
                ...data.history,
                level_updates: updatedLevelUpdates,
              },
            }
            batch.update(ref, payload)
          }
        }
        close()
        await batch.commit()
        await addDoc(collection(DB, "history"), {
          created_at: serverTimestamp(),
          user: user?.displayName,
          action: `batch updated of ${ids.length} players levels to ${level}`,
        })
        showNotif("Batch player levels updated successfully!", "success")
      } catch (error: unknown) {
        console.error("Error updating document:", error)
      } finally {
        setLoading(false)
      }
    }
  }

  const close = () => {
    setTimeout(() => {
      setLevel("")
      setPlayers([])
    }, 125)
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
          <DialogTitle>Batch Player Levels</DialogTitle>
          <DialogContent>
            <Stack gap={1}>
              <FormControl sx={{ gap: 1 }} fullWidth>
                <FormLabel>Batch Player Level</FormLabel>
                <Select
                  displayEmpty
                  MenuProps={{
                    PaperProps: { sx: { maxHeight: 260 } },
                  }}
                  id="level"
                  value={level}
                  onChange={(event) => setLevel(event.target.value)}
                >
                  <MenuItem value="">No Level</MenuItem>
                  {levels.map((level: any, index: number) => (
                    <MenuItem key={index} value={level}>
                      {level}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="body1" color="initial">
                This will affect the following players:
              </Typography>
              <Box sx={{ height: 200 }}>
                <DataGrid
                  rows={players}
                  columns={playerColumns}
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
                          No. of Affected Players: <b>{players.length}</b>
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
                          Oops! No player selected.
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
            <LoadingButton
              loading={loading}
              variant="contained"
              color="warning"
              onClick={() => batchUpdate(rows)}
            >
              Batch Update
            </LoadingButton>
            <LoadingButton color="error" onClick={close}>
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
  const [openHistory, setOpenHistory] = useState<boolean>(false)
  const [openView, setOpenView] = useState<boolean>(false)
  const [openRemove, setOpenRemove] = useState<boolean>(false)
  const [openBatch, setOpenBatch] = useState<boolean>(false)
  const [id, setId] = useState<string | null>()
  const [edit, setEdit] = useState<boolean>(false)
  const [rowSelectionModel, setRowSelectionModel] =
    useState<GridRowSelectionModel>([])

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const ref = collection(DB, "players")
        const unsubscribe = onSnapshot(ref, {
          next: (snapshot) => {
            setRows(
              snapshot.docs.map((doc: any) => {
                const { personal_details, player_details } = doc.data()
                return {
                  id: doc.id,
                  first_name: personal_details.first_name,
                  last_name: personal_details.last_name,
                  gender: personal_details.gender,
                  level: player_details.level,
                  club: player_details.club,
                  actions: { id: doc.id },
                }
              })
            )
            setLoading(false)
          },
        })

        return () => unsubscribe()
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
      field: "first_name",
      headerName: "First Name",
      flex: 1,
    },
    {
      field: "last_name",
      headerName: "Last Name",
      flex: 1,
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
            color={gender == "male" ? "#3e4772" : "#CC99CC"}
            textTransform="capitalize"
            fontWeight={700}
          >
            {gender}
          </Typography>
        )
      },
    },
    {
      field: "level",
      headerName: "Level",
      flex: 1,
      renderCell: (params: any) => {
        const level = params.value
        return (
          <Typography variant="inherit" textTransform="capitalize">
            {!!level ? level : "Not Assigned"}
          </Typography>
        )
      },
    },
    {
      field: "club",
      headerName: "Club",
      flex: 1,
      renderCell: (params: any) => {
        const club = params.value
        return (
          <Typography variant="inherit" textTransform="capitalize">
            {!!club ? club : "No Club"}
          </Typography>
        )
      },
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
            <Tooltip title="History">
              <IconButton
                size="small"
                color="warning"
                onClick={() => handleOpenHistory(actions.id)}
              >
                <ListIcon />
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

  const handleOpenHistory = (id: string) => {
    if (id) setId(id)
    setOpenHistory(true)
  }

  const handleCloseHistory = () => {
    if (id) {
      setTimeout(() => {
        setId(null)
      }, 125)
    }
    setOpenHistory(false)
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

  const handleOpenBatch = () => {
    setOpenBatch(true)
  }

  const handleCloseBatch = () => {
    setOpenBatch(false)
    setRowSelectionModel([])
  }

  return (
    <Box sx={{ height: "100%" }}>
      <PlayerForm
        id={id}
        open={openForm}
        onClose={handleCloseForm}
        edit={edit}
      />
      <HistoryForm id={id} open={openHistory} onClose={handleCloseHistory} />
      <ViewPlayer id={id} open={openView} onClose={handleCloseView} />
      <RemovePlayer id={id} open={openRemove} onClose={handleCloseRemove} />
      <BatchPlayers
        rows={rowSelectionModel}
        open={openBatch}
        onClose={handleCloseBatch}
      />
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        onCellClick={(params: any) => {
          if (params.field !== "actions" && params.field !== "__check__")
            handleOpenView(params.id)
        }}
        onRowSelectionModelChange={(newRowSelectionModel) => {
          setRowSelectionModel(newRowSelectionModel)
        }}
        rowSelectionModel={rowSelectionModel}
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
            <PlayerGridToolbar
              action={() => handleOpenForm(false)}
              rows={rowSelectionModel}
              actionForRows={handleOpenBatch}
            />
          ),
          loadingOverlay: () => <LinearProgress />,
          noRowsOverlay: () => (
            <Box
              sx={{
                width: "100%",
                height: "100%",
                display: "grid",
                alignItems: "center",
              }}
            >
              <Typography variant="inherit" color="inherit" textAlign="center">
                Oops! No players.
              </Typography>
            </Box>
          ),
        }}
        pageSizeOptions={[20, 50, 100]}
        disableRowSelectionOnClick
        checkboxSelection
      />
    </Box>
  )
}
