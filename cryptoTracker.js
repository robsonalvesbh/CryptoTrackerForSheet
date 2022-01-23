/**
 * Script
 */
const COINMARKET_ENDPOINT =
  "https://api.coinmarketcap.com/data-api/v3/cryptocurrency/listing?start=1&limit=500&convert=USD&audited=false&aux=ath";
const cacheService = CacheService.getUserCache();

const cache = {
  getKey(token) {
    const cacheKey = encodeURIComponent(Session.getTemporaryActiveUserKey());
    return `${cacheKey}_${token}`;
  },

  get(token) {
    const key = cache.getKey(token);
    cacheService.get(key);
  },

  put(token, price, ttl = 60) {
    const key = cache.getKey(token);
    cacheService.put(key, price, ttl);
  },
};

const http = {
  getTokens() {
    const response = UrlFetchApp.fetch(COINMARKET_ENDPOINT);

    const payload = response.getContentText();
    const data = JSON.parse(payload);

    if (data.status["error_message"] === "SUCCESS") {
      return data.data.cryptoCurrencyList;
    }

    throw new Error("Unable to get tokens from CoinMarketCap");
  },
};

const priceUtil = {
  roundPrice(price) {
    return (Math.round(price * 100) / 100).toFixed(2);
  },

  parse(price) {
    return parseFloat(price);
  },
};

function cryptoTracker(token) {
  const cachedPrice = cache.get(token);

  if (cachedPrice && cachedPrice != null) {
    return priceUtil.parse(cachedPrice);
  }

  const tokens = http.getTokens();

  const coin = tokens.find((coin) => {
    if (token == coin.symbol) {
      return coin;
    }
  });

  if (!coin) {
    throw new Error("Token not available or the symbol is wrong!");
  }

  const price = priceUtil.roundPrice(coin.quotes[0].price);
  cache.put(token, price);
  return priceUtil.parse(price);
}
