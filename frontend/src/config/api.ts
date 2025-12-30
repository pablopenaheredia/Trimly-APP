// En Vite, el modo real se controla por `import.meta.env.MODE` y `import.meta.env.PROD`.
// Evitamos depender de una variable custom (`VITE_ENV`) porque puede quedar mal seteada
// y hacer que el frontend local apunte por error al backend de Vercel.
export const API_URL = import.meta.env.PROD
  ? import.meta.env.VITE_API_URL
  : 'http://localhost:3000';
