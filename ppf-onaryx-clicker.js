const io = require('socket.io-client');

if (process.env.TG_ID && process.env.PANTINI_TOKEN) {
  const client = io('wss://onaryx.ru', {
    query: {
      id:    process.env.TG_ID,
      token: process.env.PANTINI_TOKEN
    }
  });

  client.on('ticker', data => {
    if (data.m === 'ppf') {
      console.log(data);
    }
  });
}
