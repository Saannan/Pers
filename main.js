const YTDL = require('@distube/ytdl-core')
const { spawn } = require('child_process')
const express = require('express')
const fs = require('fs')
const axios = require('axios')

const app = express()
const port = 3000

function Decode(type) {
  return decodeURIComponent(type)
}

app.use('/files', express.static('temp'))
app.listen(port, () => console.log(`Server jalan di http://localhost:${port}`))

const cookies = [{
        name: "__Secure-1PAPISID",
        value: "H_2IeDUX5Z7CckgN/AE-X-OcSmHhUDs0f2"
    },
    {
        name: "__Secure-1PSID",
        value: "g.a000qQixZWIZIFjTzOH_1mkOhpxby4XPdp1Z2AiERhCTm_8LbiAOng1TbrfRHXBF9gx0ihKvQAACgYKAS0SARQSFQHGX2Mi19F2KdBiRrcbYU9Oraa0NxoVAUF8yKqP8KiuL8KThKHScKZ_o_Wc0076"
    },
    {
        name: "__Secure-1PSIDCC",
        value: "AKEyXzVuRKSIfoD1KtEdq9DlYatiYpQaXxDeSqNdFiYZZVoGpxo_5aIfPkr7ZyofOC_GPtjG6g"
    },
    {
        name: "__Secure-1PSIDTS",
        value: "sidts-CjEBQT4rXyk6eHqf1odJUs9PNgCgDZsI-1LVDp2Tl8sI6xpVEH5S_FLrCtg2W2vY9hCPEAA"
    },
    {
        name: "__Secure-3PAPISID",
        value: "H_2IeDUX5Z7CckgN/AE-X-OcSmHhUDs0f2"
    },
    {
        name: "__Secure-3PSID",
        value: "g.a000qQixZWIZIFjTzOH_1mkOhpxby4XPdp1Z2AiERhCTm_8LbiAOH_kNy13Vac_jN7WTZYmkcAACgYKAZQSARQSFQHGX2MiJz7IWUCR5lBxtCsHDuABrhoVAUF8yKrYYUMHoWMYV64lM84nlN3V0076"
    },
    {
        name: "__Secure-3PSIDCC",
        value: "AKEyXzW0PwihqH43gSbj3hqqSl2AKr78AmCSpACv3Kh2Zj8QyuIeCiJhZ8db-4AeQ_0lhi2r"
    },
    {
        name: "__Secure-3PSIDTS",
        value: "sidts-CjEBQT4rXyk6eHqf1odJUs9PNgCgDZsI-1LVDp2Tl8sI6xpVEH5S_FLrCtg2W2vY9hCPEAA"
    },
    {
        name: "APISID",
        value: "tsKIe0XwubcRP9oF/AbUexFDZ4zgoi7UgO"
    },
    {
        name: "GPS",
        value: "1"
    },
    {
        name: "HSID",
        value: "AUIqc7JihwALVx4Jf"
    },
    {
        name: "LOGIN_INFO",
        value: "AFmmF2swRQIgZ_mcqDjlI0gs-TGrhgUMogyb-NMilC2Ty6oE48l15C0CIQCvPQZgfct3lKtuSPZYqzZ3WNs7ESJg6On2rY18z3Cqzw:QUQ3MjNmeHdVNTY5Z2hFUmFocGh6el9OZy1MLVduWUd0SC1vZnZqbXhYTmpONXg4M2tKXzJFTjItcVM5VE1pYkhrVWhYdWFweEg1QjdlSUxYancwZ3lrX21OSFRZTExweVBMWHhIZXVTU0Q0V2h6WWhHbHE0RG5sQzhiQkV6b3ZQbm5XRURYVUFyeTgyWEN1NnNuQktETGF5WlBsSnFuMUtB"
    },
    {
        name: "PREF",
        value: "f6=40000000&tz=Asia.Jakarta"
    },
    {
        name: "SAPISID",
        value: "H_2IeDUX5Z7CckgN/AE-X-OcSmHhUDs0f2"
    },
    {
        name: "SID",
        value: "g.a000qQixZWIZIFjTzOH_1mkOhpxby4XPdp1Z2AiERhCTm_8LbiAO9-MYA1dwrovJFMWWurfPPgACgYKAdkSARQSFQHGX2MiG0yi4bMkCiQPzU_oCHCXrhoVAUF8yKo7a0pZgQV27X-vytv7Tx6o0076"
    },
    {
        name: "SIDCC",
        value: "AKEyXzVDtlNl59Z9UD9H1JJ_YcKBFlDFYmB5HOV8H1njsTtQ0Q42zkY9EaEzspgvU-SIc3NQ"
    },
    {
        name: "SSID",
        value: "ABmcpOGj-7pqse2dW"
    }
]

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

    const config = YTDL.createAgent(cookies)
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