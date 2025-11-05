const api = require('ab-downloader');

module.exports = {
    name: "Gdrive",
    desc: "Google drive downloader",
    category: "Downloader",
    path: "/download/gdrive?apikey=&url=",
    async run(req, res) {
      try {
        const { apikey, url } = req.query;
        if (!apikey || !global.apikey.includes(apikey))
          return res.json({ status: false, error: "Apikey invalid" });
        if (!url)
          return res.json({ status: false, error: "Url is required" });

        const results = await api.gdrive(url)
        res.status(200).json({
          status: true,
          result: results.result,
        });
      } catch (error) {
        res.status(500).json({ status: false, error: error.message });
      }
    }
}