const axios = require('axios')
const express = require('express')

const app = express();

async function ytdl(link, qualityIndex, typeIndex) {
  const qualities = {
    audio: { 1: '32', 2: '64', 3: '128', 4: '192' },
    video: { 1: '144', 2: '240', 3: '360', 4: '480', 5: '720', 6: '1080', 7: '1440', 8: '2160' }
  };
  
  const headers = {
    accept: '*/*',
    referer: 'https://ytshorts.savetube.me/',
    origin: 'https://ytshorts.savetube.me/',
    'user-agent': 'Postify/1.0.0',
    'Content-Type': 'application/json'
  };

  const cdn = () => Math.floor(Math.random() * 11) + 51;
  const type = typeIndex === 1 ? 'audio' : 'video';
  const quality = qualities[type][qualityIndex];
  const cdnNumber = cdn();
  const cdnUrl = `cdn${cdnNumber}.savetube.su`;

  try {
    const videoInfoResponse = await axios.post(
      `https://${cdnUrl}/info`, 
      { url: link }, 
      { headers: { ...headers, authority: `cdn${cdnNumber}.savetube.su` } }
    );
    const videoInfo = videoInfoResponse.data.data;

    const body = {
      downloadType: type,
      quality,
      key: videoInfo.key
    };

    const downloadResponse = await axios.post(
      `https://${cdnUrl}/download`,
      body,
      { headers: { ...headers, authority: `cdn${cdnNumber}.savetube.su` } }
    );
    const downloadData = downloadResponse.data.data;

    return {
      link: downloadData.downloadUrl,
      duration: videoInfo.duration,
      durationLabel: videoInfo.durationLabel,
      fromCache: videoInfo.fromCache,
      id: videoInfo.id,
      key: videoInfo.key,
      thumbnail: videoInfo.thumbnail,
      thumbnail_formats: videoInfo.thumbnail_formats,
      title: videoInfo.title,
      titleSlug: videoInfo.titleSlug,
      videoUrl: videoInfo.url,
      quality,
      type
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

app.get("/ytmp4", async (req, res) => {
  const { url, quality } = req.query;
  if (!url || !quality) {
    return res.status(400).json({
      status: false,
      error: "Missing 'url' or 'quality' parameter."
    });
  }

  try {
    const response = await ytdl(url, parseInt(quality), 2); // Video type (2)
    res.status(200).json({
      status: true,
      data: response
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      error: error.message
    });
  }
});

app.get("/ytmp3", async (req, res) => {
  const { url, quality } = req.query;
  if (!url || !quality) {
    return res.status(400).json({
      status: false,
      error: "Missing 'url' or 'quality' parameter."
    });
  }

  try {
    const response = await ytdl(url, parseInt(quality), 1); // Audio type (1)
    res.status(200).json({
      status: true,
      data: response
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`)
})
