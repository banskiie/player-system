import { Box, Button, LinearProgress, ToolbarProps } from "@mui/material"
import {
  GridColDef,
  DataGrid,
  GridToolbarContainer,
  GridToolbarQuickFilter,
} from "@mui/x-data-grid"
import { collection, onSnapshot, query, orderBy } from "firebase/firestore"
import { useEffect, useState } from "react"
import { DB } from "../api/firebase"
import styles from "../styles/datagrid.module.css"
import moment from "moment"

const HistoryGridToolbar = () => {
  return (
    <GridToolbarContainer
      sx={{ display: "flex", justifyContent: "space-between", p: 1 }}
    >
      <GridToolbarQuickFilter />
    </GridToolbarContainer>
  )
}

export default () => {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const ref = collection(DB, "history")
        onSnapshot(query(ref, orderBy("created_at", "desc")), {
          next: (snapshot) => {
            setRows(
              snapshot.docs.map((doc: any) => {
                const { user, action, created_at } = doc.data()
                return {
                  id: doc.id,
                  description: `${user} ${action}`,
                  created_at: moment.unix(created_at?.seconds).format("LLLL"),
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
      field: "created_at",
      headerName: "Date",
      flex: 1,
    },
    {
      field: "description",
      headerName: "Action",
      flex: 3,
    },
  ]

  return (
    <Box sx={{ height: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
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
          toolbar: () => <HistoryGridToolbar />,
          loadingOverlay: () => <LinearProgress />,
        }}
        pageSizeOptions={[20, 50, 100]}
        disableRowSelectionOnClick
      />
    </Box>
  )
}
