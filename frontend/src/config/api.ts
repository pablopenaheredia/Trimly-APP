export const API_URL =  
  import.meta.env.VITE_ENV === 'production'  
    ? import.meta.env.VITE_API_URL  
    : 'http://localhost:3000';