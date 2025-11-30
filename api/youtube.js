// youtube.js (UPDATED)
// Perbaikan: follow-redirect and return final direct URL for ytmp4 / ytmp3

const fetch = require("node-fetch");
const cheerio = require("cheerio");

const yt = {
    get baseUrl() {
        return {
            origin: 'https://ssvid.net'
        }
    },

    get baseHeaders() {
        return {
            'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'origin': this.baseUrl.origin,
            'referer': this.baseUrl.origin + '/youtube-to-mp3'
        }
    },

    validateFormat: function (userFormat) {
        const validFormat = ['mp3', '360p', '720p', '1080p']
        if (!validFormat.includes(userFormat)) throw Error(`invalid format!. available formats: ${validFormat.join(', ')}`)
    },

    handleFormat: function (userFormat, searchJson) {
        this.validateFormat(userFormat)
        let result
        if (userFormat == 'mp3') {
            result = searchJson.links?.mp3?.mp3128?.k
        } else {
            let selectedFormat
            const allFormats = Object.entries(searchJson.links.mp4)

            const quality = allFormats.map(v => v[1].q).filter(v => /\d+p/.test(v)).map(v => parseInt(v)).sort((a, b) => b - a).map(v => v + 'p')
            if (!quality.includes(userFormat)) {
                selectedFormat = quality[0]
                console.log(`format ${userFormat} gak ada. auto fallback ke best available yaitu ${selectedFormat}`)
            } else {
                selectedFormat = userFormat
            }
            const find = allFormats.find(v => v[1].q == selectedFormat)
            result = find?.[1]?.k
        }
        if (!result) throw Error(`${userFormat} gak ada cuy. aneh`)
        return result
    },

    hit: async function (path, payload) {
        try {
            const body = new URLSearchParams(payload)
            const opts = { headers: this.baseHeaders, body, 'method': 'post' }
            const r = await fetch(`${this.baseUrl.origin}${path}`, opts)
            console.log('hit', path)
            if (!r.ok) throw Error(`${r.status} ${r.statusText}\n${await r.text()}`)
            const j = await r.json()
            return j
        } catch (e) {
            throw Error(`${path}\n${e.message}`)
        }
    },

    download: async function (queryOrYtUrl, userFormat = 'mp3') {
        this.validateFormat(userFormat)

        // first hit
        let search
        search = await this.hit('/api/ajax/search', {
            "query": queryOrYtUrl,
            "cf_token": "",
            "vt": "youtube"
        })

        if (search.p == 'search') {
            if (!search?.items?.length) throw Error(`hasil pencarian ${queryOrYtUrl} tidak ada`)
            const { v, t } = search.items[0]
            const videoUrl = 'https://www.youtube.com/watch?v=' + v
            console.log(`[found]\ntitle : ${t}\nurl   : ${videoUrl}`)

            // first hit again...
            search = await this.hit('/api/ajax/search', {
                "query": videoUrl,
                "cf_token": "",
                "vt": "youtube"
            })

        }

        const vid = search.vid
        const k = this.handleFormat(userFormat, search)

        // second hit
        const convert = await this.hit('/api/ajax/convert', {
            k, vid
        })

        if (convert.c_status == 'CONVERTING') {
            let convert2
            const limit = 5
            let attempt = 0
            do {
                attempt++
                // third hit
                console.log (`cek convert ${attempt}/${limit}`)
                convert2 = await this.hit('/api/convert/check?hl=en', {
                    vid,
                    b_id: convert.b_id
                })
                if (convert2.c_status == 'CONVERTED') {
                    return convert2
                }
                await new Promise(re => setTimeout(re, 5000))
            } while (attempt < limit && convert2.c_status == 'CONVERTING')
            throw Error('file belum siap / status belum di ketahui')

        } else {
            return convert
        }
    },

}

// Helper: follow redirects and produce final url without downloading full file
async function resolveFinalUrl(url, timeout = 20000) {
  const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36";

  try {
    // Try HEAD first (faster, no body)
    const headRes = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      timeout,
      headers: {
        "User-Agent": UA,
        "Accept": "*/*"
      }
    });

    if (headRes.ok) {
      // headRes.url is the final URL after redirects
      if (headRes.url) return headRes.url;
    }
  } catch (e) {
    // ignore HEAD failure and try lightweight GET below
    console.warn("HEAD failed:", e.message || e);
  }

  try {
    // Fallback: small-range GET (ask only first bytes)
    const getRes = await fetch(url, {
      method: "GET",
      redirect: "follow",
      timeout,
      headers: {
        "User-Agent": UA,
        "Range": "bytes=0-1023",
        "Accept": "*/*"
      }
    });

    if (getRes.ok) {
      return getRes.url || url;
    } else {
      throw new Error(`status ${getRes.status}`);
    }
  } catch (e) {
    throw new Error(`failed resolve final url: ${e.message || e}`);
  }
}

module.exports = [
  {
    name: "Ytmp4",
    desc: "Download video youtube",
    category: "Downloader",
    path: "/download/ytmp4?apikey=&url=",
    async run(req, res) {
      try {
        const { apikey, url } = req.query;
        if (!apikey || !global.apikey.includes(apikey))
          return res.json({ status: false, error: "Apikey invalid" });
        if (!url)
          return res.json({ status: false, error: "Url is required" });

        const results = await yt.download(url, "360p", "mp4");

        // results.dlink may be redirect link. Resolve to final direct URL
        let finalUrl;
        try {
          finalUrl = await resolveFinalUrl(results.dlink);
        } catch (errResolve) {
          // If cannot resolve, fallback to original dlink but warn
          console.warn("resolveFinalUrl failed, returning original dlink:", errResolve.message);
          finalUrl = results.dlink;
        }

        res.status(200).json({
          status: true,
          // keep original dlink for backward compatibility, also return final direct url
          result: finalUrl,
          raw: { dlink: results.dlink }
        });
      } catch (error) {
        res.status(500).json({ status: false, error: error.message });
      }
    },
  },

  {
    name: "Ytmp3",
    desc: "Download audio youtube",
    category: "Downloader",
    path: "/download/ytmp3?apikey=&url=",
    async run(req, res) {
      try {
        const { apikey, url } = req.query;
        if (!apikey || !global.apikey.includes(apikey))
          return res.json({ status: false, error: "Apikey invalid" });
        if (!url)
          return res.json({ status: false, error: "Url is required" });

        const results = await yt.download(url, "mp3");

        let finalUrl;
        try {
          finalUrl = await resolveFinalUrl(results.dlink);
        } catch (errResolve) {
          console.warn("resolveFinalUrl failed, returning original dlink:", errResolve.message);
          finalUrl = results.dlink;
        }

        res.status(200).json({
          status: true,
          result: finalUrl,
          raw: { dlink: results.dlink }
        });
      } catch (error) {
        res.status(500).json({ status: false, error: error.message });
      }
    },
  }
];
