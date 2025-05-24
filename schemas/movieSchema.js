import z from 'zod'

const movieSchema = z.object({
  title: z.string({
    invalid_type_error: 'Movie title must be a string',
    required_error: 'Movie title is required'
  }),
  year: z.number().int().min(1900).max(2025),
  director: z.string(),
  duration: z.number().positive(),
  rate: z.optional(z.number().min(0).min(10)),
  poster: z.string().url({
    message: 'Poster must be a valid url'
  }).endsWith('.jpg'),
  genre: z.array(z.enum(['Action', 'Adventure', 'Comedy', 'Crime', 'Drama', 'Fantasy', 'Horror', 'Thriller', 'Sci-Fi']),
    {
      required_error: 'Genre is required',
      invalid_type_error: 'Genre is an array of genres'
    })
})

function validateMovie (object) {
  return movieSchema.safeParse(object)
}

function validatePartialMovie (object) {
  return movieSchema.partial().safeParse(object)
}

export { validateMovie, validatePartialMovie }
