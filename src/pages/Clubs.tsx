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
  Stack,
  Tooltip,
} from "@mui/material"
import {
  DataGrid,
  GridColDef,
  GridToolbarContainer,
  GridToolbarQuickFilter,
} from "@mui/x-data-grid"
import { Delete, Edit, AddCircle as Add } from "@mui/icons-material"
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
import { InitialClubState, ClubReducer } from "../reducers/club"
import { PageLoader } from "../components/ui/Loading"
import { useNotifStore } from "../store/notif"
import styles from "../styles/datagrid.module.css"
import { useAuthStore } from "../store/auth"

const ClubGridToolbar = ({ action }: ToolbarProps) => {
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
        Add Club
      </Button>
    </GridToolbarContainer>
  )
}

const ClubForm = ({ id, edit, open, onClose }: DialogProps) => {
  const { user } = useAuthStore(state => state)
  const { showNotif } = useNotifStore((state) => state)
  const [payload, dispatch] = useReducer(ClubReducer, InitialClubState)
  // Data
  const { name } = payload
  // Form
  const [loading, setLoading] = useState<boolean>(false)
  const [errors, setErrors] = useState<any>(null)

  useEffect(() => {
    if (id) {
      const fetch = async () => {
        setLoading(true)
        try {
          const ref = doc(DB, `clubs/${id}`)
          const snapshot = await getDoc(ref)

          if (snapshot.exists()) {
            const data = snapshot.data()
            for (const key in data) {
              if (key in InitialClubState) {
                set(key, data[key])
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

  const set = (field: string, value: any) => {
    dispatch({ type: "SET_FIELD", field, value })
    setErrors((prev: any) => {
      return { ...prev, [field]: "" }
    })
  }

  const validate = () => {
    let newErrors: any = {}
    const defaultError = "This field is required."

    switch (true) {
      case !(name && name.trim()):
        newErrors.name = defaultError
        dispatch({ type: "SET_FIELD", field: "name", value: "" })
        break
      default:
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const update = async () => {
    setLoading(true)
    try {
      await updateDoc(doc(DB, `clubs/${id}`), payload)
      await addDoc(collection(DB, "history"), {
        created_at: serverTimestamp(),
        user: user?.displayName,
        action: `updated details of club, ${name}.`,
      })
      showNotif("Club updated successfully!", "success")
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
      await addDoc(collection(DB, "clubs"), {
        created_at: serverTimestamp(),
        ...payload,
      })
      await addDoc(collection(DB, "history"), {
        created_at: serverTimestamp(),
        user: user?.displayName,
        action: `added new club, ${name}.`,
      })
      close()
      showNotif("Club added successfully!", "success")
    } catch (error: unknown) {
      console.error("Error submitting document:", error)
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
          maxWidth="sm"
          hideBackdrop
          fullWidth
        >
          <DialogTitle>
            {edit ? `Update Club: ${name}` : "Add Club"}
            <Typography variant="body2" component="div">
              Fields with (
              <Typography variant="inherit" display="inline" color="error">
                *
              </Typography>
              ) are required.
            </Typography>
          </DialogTitle>
          <DialogContent>
            <FormControl
              required
              error={!!errors?.name}
              sx={{ gap: 1 }}
              fullWidth
            >
              <FormLabel>Club Name</FormLabel>
              <TextField
                id="club_name"
                label=""
                value={name}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  set("name", event.target.value)
                }
                error={!!errors?.name}
                placeholder="Enter Club Name"
                onKeyDown={enter}
                helperText={!!errors?.name && errors.name}
              />
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <LoadingButton
              loading={loading}
              variant="contained"
              onClick={edit ? update : submit}
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

const ViewClub = ({ id, open, onClose }: DialogProps) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    if (id) {
      const fetch = async () => {
        setLoading(true)
        try {
          const ref = doc(DB, `clubs/${id}`)
          const snapshot = await getDoc(ref)

          if (snapshot.exists()) {
            setData(snapshot.data())
          } else {
            throw "Something went wrong!"
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
          <DialogTitle>View Club: {data?.name}</DialogTitle>
          <DialogContent>
            <Stack>
              <Typography variant="body2">Name</Typography>
              <Typography variant="body1" fontWeight={700}>
                {data?.name}
              </Typography>
            </Stack>
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

const RemoveClub = ({ id, open, onClose }: DialogProps) => {
  const { user } = useAuthStore(state => state)
  const { showNotif } = useNotifStore((state) => state)
  const [loading, setLoading] = useState<boolean>(false)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    if (id) {
      const fetch = async () => {
        setLoading(true)
        try {
          const ref = doc(DB, `clubs/${id}`)
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
      await deleteDoc(doc(DB, `clubs/${id}`))
      await addDoc(collection(DB, "history"), {
        created_at: serverTimestamp(),
        user: user?.displayName,
        action: `deleted club, ${name}.`,
      })
      showNotif("Club successfully deleted!", "success")
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
          <DialogTitle>Delete Club: {data?.name}</DialogTitle>
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
        const ref = collection(DB, "clubs")
        onSnapshot(query(ref, orderBy("name", "asc")), {
          next: (snapshot) => {
            setRows(
              snapshot.docs.map((doc: any) => {
                const { name } = doc.data()
                return {
                  id: doc.id,
                  name,
                  actions: { id: doc.id },
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

  const columns: GridColDef[] = [
    {
      field: "id",
      headerName: "ID",
      width: 90,
      filterable: false,
    },
    {
      field: "name",
      headerName: "Club Name",
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
      <ClubForm id={id} open={openForm} onClose={handleCloseForm} edit={edit} />
      <ViewClub id={id} open={openView} onClose={handleCloseView} />
      <RemoveClub id={id} open={openRemove} onClose={handleCloseRemove} />
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
            <ClubGridToolbar action={() => handleOpenForm(false)} />
          ),
          loadingOverlay: () => <LinearProgress />,
        }}
        pageSizeOptions={[20, 50, 100]}
        disableRowSelectionOnClick
      />
    </Box>
  )
}
