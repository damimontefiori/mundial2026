import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

/**
 * Firebase (Auth + Firestore) para el login con Google y la sincronización en la
 * nube. Es OPCIONAL: si faltan las env vars, `auth` y `db` quedan en `null` y la
 * app sigue funcionando 100% local-first (sin botón de login).
 *
 * La config web (apiKey, etc.) es PÚBLICA por diseño: la seguridad la dan las
 * security rules de Firestore + los dominios autorizados de Auth.
 */
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseEnabled = Boolean(config.apiKey && config.authDomain && config.projectId);

let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

// Inicializar solo en el browser (evita correr el SDK en el render del servidor).
if (firebaseEnabled && typeof window !== 'undefined') {
  const app = getApps().length ? getApp() : initializeApp(config);
  authInstance = getAuth(app);
  dbInstance = getFirestore(app);
}

export const auth = authInstance;
export const db = dbInstance;
