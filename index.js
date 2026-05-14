const express = require('express')
const multer = require('multer')
const cors = require('cors')
const dotenv = require('dotenv')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')

dotenv.config()

const app = express()
app.use(cors({
  origin: [
    'https://media-app-nu-one.vercel.app/', // ← ton URL Vercel
    'http://localhost:5173' // ← pour le dev local
  ],
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type']
}))

const upload = multer({ storage: multer.memoryStorage() })

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY,
  }
})

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Route d'upload
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file
    const key = `uploads/${Date.now()}-${file.originalname}`

    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }))

    res.json({
      key,
      url: `${process.env.R2_PUBLIC_URL}/${key}`
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Erreur upload" })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`)
})