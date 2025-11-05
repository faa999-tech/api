const fetch = require("node-fetch");
const cheerio = require("cheerio");
const api = require("@mr.janiya/xnxx-scraper")

async function xnxxdl(URL) {
  const res = await fetch(URL);
  const html = await res.text();
  const $ = cheerio.load(html);

  const title = $('meta[property="og:title"]').attr('content');
  const duration = $('meta[property="og:duration"]').attr('content');
  const image = $('meta[property="og:image"]').attr('content');
  const videoType = $('meta[property="og:video:type"]').attr('content');
  const videoWidth = $('meta[property="og:video:width"]').attr('content');
  const videoHeight = $('meta[property="og:video:height"]').attr('content');
  const info = $('span.metadata').text();
  const script = $('#video-player-bg > script:nth-child(6)').html();

  const extract = (regex) => (script.match(regex) || [])[1];

  const files = {
    low: extract(/html5player\.setVideoUrlLow\('(.*?)'\);/),
    high: extract(/html5player\.setVideoUrlHigh\('(.*?)'\);/),
    HLS: extract(/html5player\.setVideoHLS\('(.*?)'\);/),
    thumb: extract(/html5player\.setThumbUrl\('(.*?)'\);/),
    thumb69: extract(/html5player\.setThumbUrl169\('(.*?)'\);/),
    thumbSlide: extract(/html5player\.setThumbSlide\('(.*?)'\);/),
    thumbSlideBig: extract(/html5player\.setThumbSlideBig\('(.*?)'\);/)
  };

  return {
    title,
    URL,
    duration,
    image,
    videoType,
    videoWidth,
    videoHeight,
    info,
    files
  };
}

module.exports = [
  {
    name: "XNXX Search",
    desc: "Search xnxx video",
    category: "Search",
    path: "/search/xnxx?apikey=&q=",
    async run(req, res) {
      try {
        const { apikey, q } = req.query;
        if (!apikey || !global.apikey.includes(apikey)) return res.json({ status: false, error: 'Apikey invalid' });
        if (!q) return res.json({ status: false, error: 'Query is required' });

        const ress = await api.xnxxSearch(q);
        res.status(200).json({ status: true, result: ress.result });
      } catch (e) {
        res.status(500).json({ status: false, error: e.message });
      }
    }
  },
  {
    name: "XNXX",
    desc: "Xnxx Downloader",
    category: "Downloader",
    path: "/download/xnxx?apikey=&url=",
    async run(req, res) {
      try {
        const { apikey, url } = req.query;
        if (!apikey || !global.apikey.includes(apikey)) return res.json({ status: false, error: 'Apikey invalid' });
        if (!url) return res.json({ status: false, error: 'Url is required' });

        const result = await xnxxdl(url);
        res.status(200).json({ status: true, result });
      } catch (e) {
        res.status(500).json({ status: false, error: e.message });
      }
    }
  }
];