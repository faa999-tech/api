const ytdl = require('ytdl-core');
module.exports = [
  {
    name: "Ytmp4",
    desc: "Download video YouTube (direct MP4 URL)",
    category: "Downloader",
    path: "/download/ytmp4?apikey=&url=",
    async run(req, res) {
      try {
        const { apikey, url } = req.query;
        if (!apikey || !global.apikey.includes(apikey))
          return res.json({ status: false, error: "Apikey invalid" });
        if (!url) return res.json({ status: false, error: "Url is required" });
        if (!ytdl.validateURL(url)) return res.json({ status: false, error: "URL YouTube tidak valid" });
        const info = await ytdl.getInfo(url);
        // choose a combined audio+video format (prefer mp4)
        const format = ytdl.chooseFormat(info.formats, { quality: '18', filter: format => format.container === 'mp4' || (format.hasAudio && format.hasVideo) });
        if (!format || !format.url) return res.json({ status: false, error: "Tidak bisa mendapatkan direct MP4 link" });
        res.json({
          status: true,
          title: info.videoDetails.title,
          thumbnail: info.videoDetails.thumbnails.slice(-1)[0]?.url || null,
          quality: format.qualityLabel || null,
          size: format.contentLength ? (Number(format.contentLength)/1024/1024).toFixed(2) + " MB" : null,
          result: format.url
        });
      } catch (err) {
        console.error("ytmp4 error", err);
        res.status(500).json({ status: false, error: err.message });
      }
    },
  },
  {
    name: "Ytmp3",
    desc: "Download audio YouTube (direct audio URL)",
    category: "Downloader",
    path: "/download/ytmp3?apikey=&url=",
    async run(req, res) {
      try {
        const { apikey, url } = req.query;
        if (!apikey || !global.apikey.includes(apikey))
          return res.json({ status: false, error: "Apikey invalid" });
        if (!url) return res.json({ status: false, error: "Url is required" });
        if (!ytdl.validateURL(url)) return res.json({ status: false, error: "URL YouTube tidak valid" });
        const info = await ytdl.getInfo(url);
        const format = ytdl.chooseFormat(info.formats, { filter: 'audioonly', quality: 'highestaudio' });
        if (!format || !format.url) return res.json({ status: false, error: "Tidak bisa mendapatkan direct MP3 link" });
        res.json({
          status: true,
          title: info.videoDetails.title,
          thumbnail: info.videoDetails.thumbnails.slice(-1)[0]?.url || null,
          size: format.contentLength ? (Number(format.contentLength)/1024/1024).toFixed(2) + " MB" : null,
          result: format.url
        });
      } catch (err) {
        console.error("ytmp3 error", err);
        res.status(500).json({ status: false, error: err.message });
      }
    },
  }
];