import { useAuthStore } from "../store/auth"

interface LevelUpdate {
  date: Date
  leveller: string
  new_level: string
}

export interface TournamentJoined {
  tournament: string
  event: string
  standing: string
  partner_id?: string | number
}

interface Player {
  personal_details: {
    first_name: string
    middle_name?: string
    last_name: string
    picture_name?: string
    email?: string
    contact_no?: string
    birth_date: Date
    is_international: boolean
    international_address?: {
      address: string
      country: string
    }
    birth_address?: {
      address: string
      barangay: string
      municipality: string
      province: string
    }
    gender: string
  }
  player_details: {
    club: string
    level: string
    id: string
  }
  history: {
    level_updates: LevelUpdate[]
    tournaments_joined: TournamentJoined[]
  }
}

export const InitialPlayerState: Player = {
  personal_details: {
    first_name: "",
    middle_name: "",
    last_name: "",
    gender: "",
    picture_name: "",
    email: "",
    contact_no: "",
    birth_date: new Date(),
    is_international: false,
    international_address: {
      address: "",
      country: "",
    },
    birth_address: {
      address: "",
      barangay: "",
      municipality: "",
      province: "",
    },
  },
  player_details: {
    club: "",
    level: "",
    id: "",
  },
  history: {
    level_updates: [
      {
        date: new Date(),
        leveller: useAuthStore.getState().user?.displayName ?? "",
        new_level: "",
      },
    ],
    tournaments_joined: [],
  },
}

export const PlayerReducer = (state: any, action: any) => {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value }
    case "RESET_FIELDS":
      return InitialPlayerState
    default:
      return state
  }
}
