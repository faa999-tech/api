const ytdl = require("@distube/ytdl-core");

module.exports = [
  {
    name: "Ytmp4",
    desc: "Download video YouTube",
    category: "Downloader",
    path: "/download/ytmp4?apikey=&url=",
    async run(req, res) {
      try {
        const { apikey, url } = req.query;

        if (!apikey || !global.apikey.includes(apikey))
          return res.json({ status: false, error: "Apikey invalid" });

        if (!url)
          return res.json({ status: false, error: "Url is required" });

        if (!ytdl.validateURL(url)) 
          return res.json({ status: false, error: "URL YouTube tidak valid" });

        const info = await ytdl.getInfo(url);

        // ambil kualitas 360p atau yang paling dekat
        const format = ytdl.chooseFormat(info.formats, {
          quality: "18",  // 360p
          filter: "videoandaudio"
        });

        if (!format || !format.url)
          return res.json({ status: false, error: "Tidak bisa mendapatkan direct MP4 link" });

        res.json({
          status: true,
          title: info.videoDetails.title,
          thumbnail: info.videoDetails.thumbnails.slice(-1)[0].url,
          quality: format.qualityLabel,
          size: (format.contentLength / 1024 / 1024).toFixed(2) + " MB",
          result: format.url   // INI DIRECT GOOGLEVIDEO
        });

      } catch (err) {
        res.json({ status: false, error: err.message });
      }
    },
  },

  {
    name: "Ytmp3",
    desc: "Download audio YouTube",
    category: "Downloader",
    path: "/download/ytmp3?apikey=&url=",
    async run(req, res) {
      try {
        const { apikey, url } = req.query;

        if (!apikey || !global.apikey.includes(apikey))
          return res.json({ status: false, error: "Apikey invalid" });

        if (!url)
          return res.json({ status: false, error: "Url is required" });

        if (!ytdl.validateURL(url)) 
          return res.json({ status: false, error: "URL YouTube tidak valid" });

        const info = await ytdl.getInfo(url);

        const format = ytdl.chooseFormat(info.formats, {
          filter: "audioonly",
          quality: "highestaudio"
        });

        if (!format || !format.url)
          return res.json({ status: false, error: "Tidak bisa mendapatkan direct MP3" });

        res.json({
          status: true,
          title: info.videoDetails.title,
          thumbnail: info.videoDetails.thumbnails.slice(-1)[0].url,
          size: (format.contentLength / 1024 / 1024).toFixed(2) + " MB",
          result: format.url
        });

      } catch (err) {
        res.json({ status: false, error: err.message });
      }
    },
  }
];
