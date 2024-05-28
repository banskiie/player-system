interface Club {
  name: string
}

export const InitialClubState: Club = {
  name: "",
}

export const ClubReducer = (state: any, action: any) => {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value }
    case "RESET_FIELDS":
      return InitialClubState
    default:
      return state
  }
}
