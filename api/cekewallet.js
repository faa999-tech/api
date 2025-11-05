const axios = require("axios");

/**
 * Cek e-wallet berdasarkan provider dan nomor
 * @param {string} provider - contoh: 'dana', 'ovo', 'gopay', 'shopeepay', 'linkaja'
 * @param {string} nomor - nomor e-wallet
 */
async function cekEwallet(provider, nomor) {
  const validProviders = ["dana", "ovo", "gopay", "shopeepay", "linkaja"];
  if (!validProviders.includes(provider)) {
    return {
      status: false,
      error: "Provider tidak valid",
      valid_providers: validProviders,
    };
  }

  try {
    const timestamp = Date.now().toString();

    // bikin form-encoded body pakai URLSearchParams
    const params = new URLSearchParams();
    params.append(
      "app_reg_id",
      "cdzXkBynRECkAODZEHwkeV:APA91bHRyLlgNSlpVrC4Yv3xBgRRaePSaCYruHnNwrEK8_pX3kzitxzi0CxIDFc2oztCwcw7-zPgwE-6v_-rJCJdTX8qE_ADiSnWHNeZ5O7_BIlgS_1N8tw"
    );
    params.append("phone_uuid", "cdzXkBynRECkAODZEHwkeV");
    params.append("phone_model", "23124RA7EO");
    params.append("phoneNumber", nomor);
    params.append("request_time", timestamp);
    params.append("phone_android_version", "15");
    params.append("app_version_code", "250811");
    params.append("auth_username", "sumarjono");
    params.append("customerId", "");
    params.append("id", provider);
    params.append(
      "auth_token",
      "2604338:tMbsgZKq2JYxOG8BvTQnfm1oup0XaNPI"
    );
    params.append("app_version_name", "25.08.11");
    params.append("ui_mode", "dark");

    const config = {
      method: "POST",
      url: `https://checker.orderkuota.com/api/checkname/produk/bff66b406f/06/2604338/${provider}`,
      headers: {
        "User-Agent": "okhttp/4.12.0",
        "Accept-Encoding": "gzip",
        "Content-Type": "application/x-www-form-urlencoded",
        "signature":
          "b2d5d7a5a3d69e7f208343fd0d278a5f1c55e42e109c58203103e634875becd946e547d5b4fe307e6cf0bcd70884d10dbdc3a58368d02e0ae64b7cd741ec354c",
        timestamp,
      },
      data: params.toString(),
    };

    const response = await axios.request(config);
    return { status: true, result: response.data };
  } catch (err) {
    return { status: false, error: err.message };
  }
}

// ROUTE EXPORT
module.exports = [
  {
    name: "Cek Ewallet",
    desc: "Cek nama akun Ewallet",
    category: "Orderkuota",
    path: "/orderkuota/cekewallet?apikey=&provider=&nomor=",
    async run(req, res) {
      let { apikey, provider, nomor } = req.query;
      if (!global.apikey.includes(apikey))
        return res.json({ status: false, error: "Apikey invalid" });
      if (!provider)
        return res.json({ status: false, error: "Missing provider" });
      if (!nomor) return res.json({ status: false, error: "Missing nomor" });

      try {
        provider = provider.toLowerCase();
        const result = await cekEwallet(provider, nomor);
        res.json(result);
      } catch (error) {
        res.status(500).json({ status: false, error: error.message });
      }
    },
  },
];