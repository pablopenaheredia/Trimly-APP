# 🚀 GUÍA COMPLETA - DESPUÉS DEL DESPLIEGUE

## ✅ **LO QUE YA ESTÁ HECHO**

- ✅ Backend migrado de MySQL a PostgreSQL
- ✅ Frontend actualizado con variables de entorno
- ✅ Archivos `.env` configurados
- ✅ Script de seeds para PostgreSQL creado
- ✅ Dependencias del backend instaladas (`npm install`)

---

## 📝 **LO QUE DEBES HACER AHORA**

### **1. Actualizar el Backend `.env` con Credenciales de Supabase**

Tu amigo te dará estos datos después de crear el proyecto en Supabase:

```bash
# Edita: backend/.env
DB_HOST=db.xxxxxxxxxxxxx.supabase.co    # ← Reemplazar
DB_PORT=5432                             # ← Ya está bien
DB_USERNAME=postgres                     # ← Ya está bien
DB_PASSWORD=la_password_de_supabase     # ← Reemplazar
DB_DATABASE=postgres                     # ← Ya está bien
NODE_ENV=development                     # ← Ya está bien
FRONTEND_URL=http://localhost:5173       # ← Para desarrollo local
PORT=3000                                # ← Ya está bien
```

### **2. Poblar la Base de Datos en Supabase**

**Espera a que tu amigo te confirme que:**

- ✅ El backend está desplegado en Vercel
- ✅ Las tablas se han creado automáticamente en Supabase

**Luego:**

1. Ve a https://supabase.com/dashboard
2. Ingresa con las credenciales que te dé tu amigo
3. Selecciona el proyecto **"trimly-db"**
4. En el menú lateral → **SQL Editor**
5. Click en **+ New Query**
6. Abre el archivo: `backend/db/seeds-postgres.sql`
7. Copia TODO el contenidoe
8. Pégalo en el editor de Supabase
9. Click en **Run** (botón verde, esquina inferior derecha)
10. Deberías ver: "30 Clientes, 15 Servicios, 5 Usuarios, 50 Productos insertados"

### **3. Probar la Aplicación en Producción**

Una vez que tu amigo termine el despliegue:

1. Abre la URL del **frontend** en tu navegador

   - Ejemplo: `https://trimly-frontend.vercel.app`

2. Haz login con:

   - **Usuario**: el usuario admin que creaste en tu base de datos
   - **Contraseña**: la contraseña que configuraste para ese usuario

3. Prueba todas las funcionalidades:
   - ✅ Dashboard carga correctamente
   - ✅ Ver lista de clientes (30 clientes)
   - ✅ Ver lista de servicios (15 servicios)
   - ✅ Ver lista de productos (50 productos)
   - ✅ Crear un nuevo turno
   - ✅ Generar una factura
   - ✅ Ver reportes

### **4. Configurar Variables de Entorno para Desarrollo Local**

Si quieres seguir desarrollando en tu computadora conectado a Supabase:

**Backend** (`backend/.env`):

```env
DB_HOST=db.xxxxxxxxxxxxx.supabase.co  # ← Credenciales de Supabase
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_password_supabase
DB_DATABASE=postgres
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
PORT=3000

# Auth (JWT)
JWT_SECRET=un_secreto_largo_y_aleatorio
JWT_EXPIRES_IN=12h
```

**Frontend** (ya está bien en `frontend/.env`):

```env
VITE_API_URL=http://localhost:3000
VITE_ENV=development
```

### **5. Probar en Desarrollo Local con Supabase**

```powershell
# Terminal 1 - Backend
cd C:\Programacion\Trimly-APP-main\backend
npm run start:dev

# Terminal 2 - Frontend
cd C:\Programacion\Trimly-APP-main\frontend
npm run dev
```

Abre: http://localhost:5173

### **6. Commitear y Pushear los Cambios**

```powershell
cd C:\Programacion\Trimly-APP-main

# Ver cambios
git status

# Agregar todos los archivos
git add .

# Hacer commit
git commit -m "Migrar a PostgreSQL/Supabase y agregar seeds para base de datos"

# Pushear a la rama pablo
git push origin pablo
```

### **7. (Opcional) Crear Pull Request a Main**

Si quieres fusionar los cambios de `pablo` a `main`:

1. Ve a: https://github.com/pablopenaheredia/Trimly-APP/pulls
2. Click **New Pull Request**
3. Base: `main` ← Compare: `pablo`
4. Click **Create Pull Request**
5. Revisa los cambios
6. Click **Merge Pull Request**

---

## 🎯 **CREDENCIALES DE ACCESO**

Para login en la aplicación:

| Username         | Contraseña | Rol      | Permisos  |
| ---------------- | ---------- | -------- | --------- |
| (tu admin)       | (definida por vos) | admin    | Todos     |
| (tu empleado)    | (definida por vos) | empleado | Limitados |

---

## 📊 **DATOS INICIALES**

Después de ejecutar el script de seeds, tendrás:

- 👥 **30 Clientes** con datos completos (nombre, email, teléfono, DNI)
- ✂️ **15 Servicios** (cortes, tinturas, tratamientos, manicura, etc.)
- 👤 **5 Usuarios** (1 admin + 4 empleados)
- 📦 **50 Productos** organizados en categorías:
  - Cuidado Capilar
  - Coloración
  - Tratamientos
  - Peinado
  - Manicura
  - Herramientas
  - Facial
  - Depilación
  - Higiene

---

## ⚠️ **PROBLEMAS COMUNES Y SOLUCIONES**

### **Problema 1: "Error al ejecutar el script en Supabase"**

**Solución:**

- Asegúrate de que las tablas existan (ve a Table Editor)
- Si no existen, espera a que el backend se ejecute al menos una vez en Vercel
- Verifica que copiaste TODO el contenido del archivo `seeds-postgres.sql`

### **Problema 2: "CORS Error" en producción**

**Solución:**

- Ve a Vercel → Proyecto Backend → Settings → Environment Variables
- Verifica que `FRONTEND_URL` sea exactamente la URL del frontend (sin `/` al final)
- Redeploy el backend

### **Problema 3: "Cannot connect to database"**

**Solución:**

- Verifica las credenciales en `backend/.env`
- Asegúrate de que `DB_HOST` NO incluya `postgresql://` (solo el host)
- Verifica que la IP de tu computadora esté permitida en Supabase (Settings → Database → Connection Pooling)

### **Problema 4: "Login failed"**

**Solución:**

- Verifica que el script de seeds se haya ejecutado correctamente
- Confirma que existen usuarios en Supabase (Table Editor → usuario)
- Confirma que estás usando la contraseña real que configuraste para ese usuario

### **Problema 5: "Las tablas no existen en Supabase"**

**Solución:**

- Espera a que el backend se despliegue en Vercel
- Vercel ejecutará automáticamente el backend, que creará las tablas
- Verifica en Vercel → Backend → Logs que no haya errores

---

## 📞 **SI NECESITAS AYUDA**

1. **Revisa los logs:**

   - Backend: Vercel → Proyecto Backend → Logs
   - Frontend: Abrir DevTools (F12) → Console
   - Supabase: Dashboard → Logs → Postgres Logs

2. **Copia el mensaje de error completo** y búscalo en Google

3. **Contacta con tu amigo** que está haciendo el despliegue

---

## ✅ **CHECKLIST FINAL**

- [ ] Backend `.env` actualizado con credenciales de Supabase
- [ ] Script `seeds-postgres.sql` ejecutado en Supabase
- [ ] 30 clientes, 15 servicios, 5 usuarios y 50 productos visibles en Supabase
- [ ] Login exitoso en producción con tu usuario admin
- [ ] Todas las funcionalidades probadas en producción
- [ ] Desarrollo local funciona conectado a Supabase
- [ ] Cambios commiteados y pusheados a GitHub
- [ ] (Opcional) Pull Request creado y mergeado a main

---

## 🎉 **¡FELICITACIONES!**

Si completaste todos los pasos, tu aplicación **Trimly** está:

- ✅ Desplegada en producción (Vercel)
- ✅ Usando PostgreSQL en la nube (Supabase)
- ✅ Con datos iniciales para pruebas
- ✅ Lista para ser usada por los usuarios finales

**¡Excelente trabajo! 🚀**
