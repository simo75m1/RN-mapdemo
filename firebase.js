// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getFirestore} from "firebase/firestore"
import {getStorage } from "firebase/storage"

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyChtHlaZWU80c-Rih2ZO1ez-6kifDmqB4Y",
  authDomain: "mapdemo-8b175.firebaseapp.com",
  projectId: "mapdemo-8b175",
  storageBucket: "mapdemo-8b175.appspot.com",
  messagingSenderId: "249739598629",
  appId: "1:249739598629:web:8289895a4ef78b08ac98cc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getFirestore(app);
const storage = getStorage(app);
export {app, database, storage};