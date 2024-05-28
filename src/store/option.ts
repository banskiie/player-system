import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { provinces, municipalities, barangays } from "psgc"
import { Country } from "country-state-city"

type OptionStore = {
  countries: any[]
  provinces: any[]
  municipalities: any[]
  barangays: any[]
  levels: string[]
  standings: string[]
}

const PLAYER_LEVELS = [
  "Low A",
  "High A",
  "Low B",
  "High B",
  "Low C",
  "High C",
  "Low D",
  "High D",
  "Low E",
  "High E",
  "Low F",
  "High F",
  "Low G",
  "High G",
]

const TOURNAMENT_STANDINGS = [
  "Elimination",
  "Semi-Finalist",
  "Finalist",
  "Champion",
]

export const useOptionStore = create<OptionStore>()(
  persist(
    () => ({
      countries: Country.getAllCountries(),
      provinces: provinces
        .all()
        .sort((prev, next) => prev.name.localeCompare(next.name)),
      municipalities: municipalities.all(),
      barangays: barangays.all(),
      levels: PLAYER_LEVELS,
      standings: TOURNAMENT_STANDINGS,
    }),
    {
      name: "option-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
