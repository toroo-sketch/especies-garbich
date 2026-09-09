// ==========================================================================
// CONFIGURACIÓN DE FIREBASE
// ==========================================================================
// Acá tenés que pegar los datos de TU proyecto de Firebase (son gratis).
// Mirá el README.md para el paso a paso de cómo conseguirlos (5 minutos).
//
// Buscá esto en: Firebase Console > ⚙️ Configuración del proyecto >
// "Tus apps" > ícono </> (Web) > "Configuración del SDK"
// ==========================================================================
const firebaseConfig = {
  apiKey: "PEGÁ_ACÁ_TU_API_KEY",
  authDomain: "PEGÁ_ACÁ_TU_PROYECTO.firebaseapp.com",
  databaseURL: "https://PEGÁ_ACÁ_TU_PROYECTO-default-rtdb.firebaseio.com",
  projectId: "PEGÁ_ACÁ_TU_PROYECTO",
  storageBucket: "PEGÁ_ACÁ_TU_PROYECTO.appspot.com",
  messagingSenderId: "PEGÁ_ACÁ_TU_SENDER_ID",
  appId: "PEGÁ_ACÁ_TU_APP_ID"
};

import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue } from "firebase/database";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Todos los datos de la app viven adentro de un mismo "cajón" llamado
// "especiero" en la base de datos, para no mezclarse con otra cosa.
const RAIZ = "especiero";

/**
 * Guarda un dato (reemplaza lo que hubiera antes en esa clave).
 * Ej: guardarDato('inventario', [...])
 */
export function guardarDato(clave, data) {
  return set(ref(db, `${RAIZ}/${clave}`), data);
}

/**
 * Escucha los cambios de una clave EN TIEMPO REAL. El callback se llama
 * apenas te conectás (con el valor actual) y de nuevo cada vez que
 * cualquier persona conectada a la app cambia ese dato.
 */
export function escucharDato(clave, callback) {
  const dbRef = ref(db, `${RAIZ}/${clave}`);
  onValue(dbRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  }, (error) => {
    console.error(`Error escuchando "${clave}":`, error);
  });
}
