import { TournamentJoined } from "../reducers/player"

export interface DialogProps {
  id?: string | null
  edit?: boolean
  rows?: any
  open: boolean
  onClose: () => void
}

export interface AddTournamentProps extends DialogProps {
  add: (tournament: TournamentJoined) => void
  gender: string
}

export interface ToolbarProps {
  action: () => void
  rows?: any
  actionForRows?: () => void
}
