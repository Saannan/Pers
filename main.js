const axios = require('axios')
const express = require('express')
const fs = require('fs')
const { spawn } = require('child_process')
const puppeteer = require('puppeteer')
const YTDL = require('@distube/ytdl-core')

const app = express()
const port = 3000

function Decode(type) {
  return decodeURIComponent(type)
}

app.use('/files', express.static('temp'))
app.listen(port, () => console.log(`Server jalan di http://localhost:${port}`))

async function getYouTubeCookie() {
    const browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage()
    await page.goto('https://www.youtube.com', { waitUntil: 'networkidle2' })

    const cookies = await page.cookies()
    await browser.close()

    return cookies.map(c => `${c.name}=${c.value}`).join('; ')
}

const QualsVideo = ["144", "240", "360", "480", "720", "1080"]
const QualsAudio = ["64", "128", "192", "256", "320"]

async function Ytdl(url, type, qual = null) {
    const randomKarakter = async (length) => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        let result = ''
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return result
    }

    const FileSize = async (path) => {
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (fs.existsSync(path)) {
                    const stats = fs.statSync(path)
                    if (stats.size > 0) {
                        clearInterval(interval)
                        resolve(stats.size)
                    }
                }
            }, 500)
        })
    }

    const cookieso = await getYouTubeCookie()
    const config = YTDL.createAgent(cookieso)
    const info = await YTDL.getInfo(url, config)
    const video = info.videoDetails
    const file_id = await randomKarakter(8)

    if (type === 'mp3') {
        if (!QualsAudio.includes(qual)) return { availableQuality: QualsAudio }
        const bitrate = parseInt(qual)

        const file_path = `./temp/${file_id}.mp3`
        const stream = YTDL(url, { filter: 'audioonly', requestOptions: { headers: { Cookie: cookie } } })

        const ffmpeg = spawn('ffmpeg', ['-i', 'pipe:0', '-b:a', `${bitrate}k`, '-preset', 'ultrafast', file_path])
        stream.pipe(ffmpeg.stdin)

        await new Promise((resolve, reject) => {
            ffmpeg.on('close', resolve)
            ffmpeg.on('error', reject)
        })

        const file_size = await FileSize(file_path)
        const file_url = `http://localhost:${port}/files/${file_id}.mp3`

        return {
            audio: {
                title: video.title,
                duration: video.lengthSeconds,
                views: video.viewCount,
                likes: video.likes,
                quality: qual + 'kbps',
                description: video.description,
                thumbnail: video.thumbnails.pop().url
            },
            channel: {
                name: video.ownerChannelName,
                subscriber: video.author.subscriber_count,
                verified: video.author.verified,
                url: video.author.channel_url
            },
            file_name: `${video.title}.mp3`,
            file_url,
            file_size
        }
    }

    if (!QualsVideo.includes(String(qual))) return { availableQuality: QualsVideo }

    const formats = info.formats.map(f => ({
        itag: f.itag,
        quality: f.qualityLabel || 'Audio',
        hasAudio: !!f.audioBitrate,
        url: f.url,
        type: f.mimeType.split(';')[0]
    }))

    let format_video = formats.find(f => f.quality.includes(`${qual}p`) && !f.hasAudio)
    let format_audio = formats.find(f => f.hasAudio)

    if (!format_video) return { availableFormats: formats }

    const video_path = `./temp/${file_id}.mp4`

    const video_stream = YTDL(url, { quality: format_video.itag, requestOptions: { headers: { Cookie: cookie } } })
    const audio_stream = YTDL(url, { quality: format_audio.itag, requestOptions: { headers: { Cookie: cookie } } })

    const ffmpeg = spawn('ffmpeg', [
        '-i', 'pipe:3',
        '-i', 'pipe:4',
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-preset', 'ultrafast',
        video_path
    ], { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] })

    video_stream.pipe(ffmpeg.stdio[3])
    audio_stream.pipe(ffmpeg.stdio[4])

    await new Promise((resolve, reject) => {
        ffmpeg.on('close', resolve)
        ffmpeg.on('error', reject)
    })

    const file_size = await FileSize(video_path)
    const file_url = `http://localhost:${port}/files/${file_id}.mp4`

    return {
        video: {
            title: video.title,
            duration: video.lengthSeconds,
            views: video.viewCount,
            likes: video.likes,
            quality: format_video.quality,
            description: video.description,
            thumbnail: video.thumbnails.pop().url
        },
        channel: {
            name: video.ownerChannelName,
            subscriber: video.author.subscriber_count,
            verified: video.author.verified,
            url: video.author.channel_url
        },
        file_name: `${video.title}.mp4`,
        file_url,
        file_size
    }
}

app.get('/api/video', async (req, res) => {
  const { url, quality } = req.query
  if (!url || !quality) {
    return res.status(400).json({ status: false, error: "URL or Quality is required" })
  }
  try {
    const response = await Ytdl(`${Decode(url)}`, 'mp4', quality)
    if (response.availableQuality) {
      return res.status(400).json({
        status: false,
        error: `Available qualities: ${response.availableQuality.join(', ')}`
      })
    }
    res.status(200).json({
      status: true,
      data: response,
      author: '© V-Tube',
    })
  } catch (error) {
    res.status(500).json({ status: false, error: error.message })
  }
})

app.get('/api/audio', async (req, res) => {
  const { url, quality } = req.query
  if (!url || !quality) {
    return res.status(400).json({ status: false, error: "URL or Quality is required" })
  }
  try {
    const response = await Ytdl(`${Decode(url)}`, 'mp3', quality)
    if (response.availableQuality) {
      return res.status(400).json({
        status: false,
        error: `Available qualities: ${response.availableQuality.join(', ')}`
      })
    }
    res.status(200).json({
      status: true,
      data: response,
      author: '© V-Tube',
    })
  } catch (error) {
    res.status(500).json({ status: false, error: error.message })
  }
})

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`)
})

/*
 * © Sanjaya
 * V-Tube API
 */