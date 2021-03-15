import {io} from 'socket.io-client';
import https from 'https';

const options = {
  allowSell: false,
  whiteList: ['GTHX', 'SPCE'],
  blackList: ['AMZN', 'TSLA'],
  channels:  ['ppf-staging']
};

const fetchTIOpenAPI = async ({path, body = '', method = 'GET'}) => {
  return new Promise(async (resolve, reject) => {
    const req = https.request({
      hostname: 'api-invest.tinkoff.ru',
      port:     443,
      path,
      method,
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': body.length,
        Authorization:    `Bearer ${process.env.TI_TOKEN}`
      }
    }, async res => {
      try {
        let responseText = '';

        for await (const chunk of res) {
          responseText += chunk;
        }

        resolve(JSON.parse(responseText || 'null'));
      } catch (error) {
        reject(error);
      }
    });

    if (body)
      req.write(body);

    req.end();
  });
};

if (process.env.TG_ID && process.env.PANTINI_TOKEN && process.env.TI_TOKEN) {
  try {
    const stocks = (await fetchTIOpenAPI({path: '/openapi/market/stocks'}))?.payload?.instruments;

    if (stocks) {
      const client = io('wss://onaryx.ru', {
        query: {
          id:    process.env.TG_ID,
          token: process.env.PANTINI_TOKEN
        }
      });

      client.on('error', (error) => {
        console.log(error);
      });

      client.on('ticker', async (data) => {
        if (options.channels.indexOf(data.m) > -1) {
          const {t, p, d, v} = data;

          if (options.whiteList.indexOf(t) < 0)
            return;

          if (options.blackList.indexOf(t) > -1)
            return;

          if (d === 'b' || options.allowSell) {
            const instrument = stocks.find(s => s.ticker === t);

            if (instrument?.figi) {
              const precision = instrument.minPriceIncrement.toString().split('.')[1]?.length || 0;

              const response = await fetchTIOpenAPI({
                path:   `/openapi/orders/limit-order?figi=${instrument.figi}`,
                method: 'POST',
                body:   JSON.stringify({
                  lots:      +v,
                  operation: d === 'b' ? 'Buy' : 'Sell',
                  price:     parseFloat((Math.round(parseFloat(p) / instrument.minPriceIncrement) *
                    instrument.minPriceIncrement).toFixed(precision))
                })
              });

              if (response?.status === 'Ok') {
                console.log(`${d === 'b' ? 'Buy' : 'Sell'} LMT ${t}@${p}`.toUpperCase());
              } else
                console.error(response);
            }
          }
        }
      });
    }
  } catch (error) {
    console.error(error);
  }
}
