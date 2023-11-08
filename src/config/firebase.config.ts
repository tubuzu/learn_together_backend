import 'dotenv/config';

export const firebaseConfig = {
    apiKey: "AIzaSyA8wtJvb-GrtkKZJVvPmUSw4CAsokVl8Pk",
    authDomain: "study-together-f7622.firebaseapp.com",
    projectId: "study-together-f7622",
    storageBucket: "study-together-f7622.appspot.com",
    messagingSenderId: "899169554637",
    appId: "1:899169554637:web:7af54ebdf11d563dae5984",
    measurementId: "G-B03SZXSL70"
};

import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// Initialize Firebase first
export const app = initializeApp(firebaseConfig)

export const db = getFirestore()
export const storage = getStorage()