import { initializeApp } from "firebase/app"
import { initializeAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const config = {
  apiKey: "AIzaSyCCociG2e0Dgu41hSV_vy7LgWiw2cnfw_s",
  authDomain: "player-system.firebaseapp.com",
  projectId: "player-system",
  storageBucket: "player-system.appspot.com",
  messagingSenderId: "232422693195",
  appId: "1:232422693195:web:c8d6ee65a4f882d41630ce",
  measurementId: "G-H0VTJP5EJT",
}

export const APP = initializeApp(config)
export const AUTH = initializeAuth(APP)
export const DB = getFirestore(APP)
export const STORAGE = getStorage(APP)
