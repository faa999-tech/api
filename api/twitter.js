const api = require('ab-downloader');

module.exports = {
    name: "Twitter",
    desc: "Twitter Downloader",
    category: "Downloader",
    path: "/download/twitter?apikey=&url=",
    async run(req, res) {
      try {
        const { apikey, url } = req.query;
        if (!apikey || !global.apikey.includes(apikey))
          return res.json({ status: false, error: "Apikey invalid" });
        if (!url)
          return res.json({ status: false, error: "Url is required" });

        const results = await api.twitter(url)
        res.status(200).json({
          status: true,
          result: results.url,
        });
      } catch (error) {
        res.status(500).json({ status: false, error: error.message });
      }
    }
}