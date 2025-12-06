
import axios from 'axios'

// Change this if your backend runs on a different host
const API_BASE_URL = 'http://localhost:5000'

const api = axios.create({
  baseURL: API_BASE_URL,
})

export default api
