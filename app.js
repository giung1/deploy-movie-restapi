import { readFile } from 'fs/promises'
import crypto from 'node:crypto'
import express from 'express'
import { validateMovie, validatePartialMovie } from './schemas/movieSchema.js'

const movies = JSON.parse(await readFile('./movies.json', 'utf8'))

const app = express()
app.disable('x-powered-by')

app.use(express.json())

const ACCEPTED_ORIGINS = [
  'http://localhost:8080',
  'http://localhost:1234',
  'http://movies.com',
  'http://agustingiungi.dev',
  'http://192.168.0.188:8080'
]

const addCORSHeader = (req, res) => {
  const origin = req.header('origin')
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin)
  }
}

// Todos los recursos que son movies se identifica con /movies
app.get('/movies', (req, res) => {
  addCORSHeader(req, res)
  const { genre } = req.query
  if (genre) {
    const filteredmovies = movies.filter(
      movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase())
    )
    if (filteredmovies.length === 0) {
      return res.status(404).json({ message: 'not movies for that genre' })
    }
    return res.json(filteredmovies)
  }
  res.json(movies)
})

app.get('/movies/:id', (req, res) => { // path to regexp
  const { id } = req.params
  const movie = movies.find(movie => movie.id === id)
  movie ? res.json(movie) : res.status(404).json({ message: 'movie not found' })
})

app.post('/movies', (req, res) => {
  const validMovie = validateMovie(req.body)

  if (validMovie.error) {
    return res.status(400).json({ error: JSON.parse(validMovie.error.message) })
  }

  const newMovie = {
    id: crypto.randomUUID(), // UUID v4
    ...validMovie.data
  }

  movies.push(newMovie)
  res.status(201).json(newMovie)
})

app.patch('/movies/:id', (req, res) => {
  const validatedMovie = validatePartialMovie(req.body)

  if (!validatedMovie.success) {
    return res.status(400).json({ error: JSON.parse(validatedMovie.error.message) })
  }

  const { id } = req.params

  const movieID = movies.findIndex(movie => movie.id === id)

  if (movieID < 0) {
    return res.status(404).json({ message: 'Pelicula not found' })
  }

  const updateMovie = {
    ...movies[movieID],
    ...validatedMovie.data
  }

  movies[movieID] = updateMovie

  return res.json(updateMovie)
})

app.options('/movies/:id', (req, res) => {
  const origin = req.header('origin')
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin)
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE')
  }
  res.status(200).send()
})

app.delete('/movies/:id', (req, res) => {
  addCORSHeader(req, res)
  const { id } = req.params
  const movieToDelete = movies.findIndex(movie => movie.id === id)
  if (movieToDelete === -1) {
    res.status(404).json({ message: 'Movie not found' })
  }
  movies.splice(movieToDelete, 1)

  return res.json({ message: 'Movie deleted' })
})

const PORT = process.env.PORT ?? 1234

app.listen(PORT, () => {
  console.log(`server listening on http://localhost:${PORT}`)
})
