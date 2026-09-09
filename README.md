# El Especiero — versión para publicar en internet

Esta es la versión de tu app lista para subir a GitHub y tener un link real
(tipo `https://tuapp.vercel.app`) al que pueda entrar cualquiera, desde
cualquier celular o computadora, y que todos vean los mismos datos
actualizados al instante.

No hace falta saber programar para seguir estos pasos — son todos con clicks,
salvo dos textos cortos que hay que copiar y pegar.

---

## Por qué hace falta este paso

Adentro del chat de Claude, la app guardaba los datos en un almacenamiento
propio de Claude. Una vez que la subís a internet como una página normal,
necesita su **propia base de datos** para que todos vean lo mismo. Vamos a
usar **Firebase** (de Google), que tiene un plan gratis más que suficiente
para un negocio como el tuyo.

---

## Parte 1 — Crear la base de datos gratis (Firebase)

1. Entrá a **https://console.firebase.google.com** e iniciá sesión con una
   cuenta de Google (la que uses normalmente está bien).
2. Hacé click en **"Crear un proyecto"** (o "Add project").
3. Ponele un nombre, por ejemplo `el-especiero`. Seguí los pasos (podés
   desactivar Google Analytics, no lo necesitás). Click en "Crear proyecto".
4. Una vez creado, en el menú de la izquierda buscá **"Realtime Database"**
   (no "Firestore", es otra sección) y hacé click en **"Crear base de
   datos"**.
   - Elegí la ubicación que te sugiera.
   - Cuando pregunte por las reglas de seguridad, elegí **"Comenzar en modo
     de prueba"** (test mode). Esto la deja abierta para que todos puedan
     leer y escribir sin necesidad de usuarios ni contraseñas — ideal para
     un equipo chico que confía entre sí.
   - ⚠️ Ojo: en modo de prueba, cualquiera que tenga el link de tu app
     puede ver y modificar los datos. Como no hay usuarios/login, es igual
     de "abierto" que la versión que veníamos usando en Claude. Si en el
     futuro querés algo más privado con contraseña, se puede agregar
     después.
5. Andá a **⚙️ (el engranaje) → "Configuración del proyecto"**.
6. Bajá hasta **"Tus apps"** y hacé click en el ícono **`</>`** (Web) para
   agregar una app web.
7. Ponele un nombre (ej: `especiero-web`) y click en **"Registrar app"**.
   Firebase te va a mostrar un bloque de código con algo así:

   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "el-especiero-xxxx.firebaseapp.com",
     databaseURL: "https://el-especiero-xxxx-default-rtdb.firebaseio.com",
     projectId: "el-especiero-xxxx",
     storageBucket: "el-especiero-xxxx.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef"
   };
   ```

8. Copiá esos valores y pegalos en el archivo **`src/firebase.js`** de este
   proyecto, reemplazando donde dice `"PEGÁ_ACÁ_TU_..."`. Guardá el archivo.

Con eso ya está lista la base de datos.

---

## Parte 2 — Probarlo en tu computadora (opcional pero recomendado)

Si tenés [Node.js](https://nodejs.org) instalado, podés probarlo antes de
publicarlo:

```bash
npm install
npm run dev
```

Te va a dar un link tipo `http://localhost:5173` — abrilo y probá que todo
funcione (cargar una especia, un movimiento, etc.).

Si no tenés Node.js instalado o no querés instalarlo, podés saltar
directamente a la Parte 3 y probarlo ya publicado.

---

## Parte 3 — Subir el proyecto a GitHub

1. Entrá a **https://github.com** y creá una cuenta si no tenés.
2. Hacé click en **"New repository"** (Nuevo repositorio).
3. Ponele un nombre, por ejemplo `el-especiero`. Dejalo en "Public" o
   "Private", como prefieras. Click en **"Create repository"**.
4. En la página que te aparece, hacé click en **"uploading an existing
   file"** (subir un archivo existente).
5. Arrastrá **todos los archivos y carpetas de este proyecto** ahí (todo lo
   que está en esta carpeta: `index.html`, `package.json`, la carpeta
   `src`, etc. — no hace falta subir `node_modules` si lo llegaste a
   crear).
6. Click en **"Commit changes"** para guardar.

---

## Parte 4 — Publicarlo con un link real (Vercel)

La forma más simple, con clicks, sin usar la terminal:

1. Entrá a **https://vercel.com** y creá una cuenta gratis usando tu cuenta
   de GitHub (botón "Continue with GitHub").
2. Click en **"Add New..." → "Project"**.
3. Elegí el repositorio `el-especiero` que subiste recién y click en
   **"Import"**.
4. Vercel detecta solo que es un proyecto Vite. No hace falta tocar nada más
   — click en **"Deploy"**.
5. Esperá un minuto. Al terminar te va a dar un link tipo
   `https://el-especiero.vercel.app` — ¡ese es el link que le podés pasar a
   cualquiera para que use la app!

Cada vez que subas un cambio a GitHub (por ejemplo si en el futuro me pedís
un ajuste y volvés a subir los archivos), Vercel actualiza el link
automáticamente solo.

---

## ¿Y si quiero seguir pidiéndote cambios después de publicarlo?

Sin problema — seguí charlando conmigo acá en Claude sobre los mismos
archivos, y cuando quieras algo actualizado te vuelvo a preparar la carpeta
lista para subir a GitHub (reemplazando los archivos viejos por los
nuevos). El `firebase.js` con tus claves ya configuradas lo podés dejar
igual, no hace falta tocarlo de nuevo.
