interface Event {
  name: string
  gender: string
  count: string
  level: string
}

interface Location {
  address: string
  barangay: string
  municipality: string
  province: string
}

interface Tournament {
  name: string
  organizer: string
  location: Location
  start: Date
  end: Date
  events?: Event[]
}

export const InitialTournamentState: Tournament = {
  name: "",
  organizer: "",
  location: {
    address: "",
    barangay: "",
    municipality: "",
    province: "",
  },
  start: new Date(),
  end: new Date(),
  events: [
    {
      name: "",
      gender: "",
      count: "",
      level: "",
    },
  ],
}

export const TournamentReducer = (state: any, action: any) => {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value }
    case "RESET_FIELDS":
      return InitialTournamentState
    default:
      return state
  }
}
