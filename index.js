//  including the dependencies
const express = require('express');
const { middleware, errorMiddleware } = require('@envoy/envoy-integrations-sdk');

//  initialize Express.js with our middleware
const app = express();
app.use(middleware());

// Routes
app.post('/visitor-sign-in', async (req, res) => {
  const envoy = req.envoy; // our middleware adds an "envoy" object to req.
  const job = envoy.job;
  const visitor = envoy.payload;
  const visitorName = visitor.attributes['full-name'];
  
  const message = `${hello} ${visitorName}!`; // our custom greeting
  await job.attach({ label: 'Hello', value: message }); // show in the Envoy dashboard.
  
  res.send({});
});

app.post('/visitor-sign-out', async (req, res) => {
  const envoy = req.envoy; // our middleware adds an "envoy" object to req.
  const job = envoy.job;

  const visitor = envoy.payload;
  const visitorName = visitor.attributes['full-name'];
  const stayDuration = envoy.meta.config.STAY_DURATION;
  const signedInAt = visitor.attributes["signed-in-at"];
  const signedOutAt = visitor.attributes["signed-out-at"];

  const then = new Date(signedInAt);
  const now = new Date(signedOutAt);
  const delta = (now - then) / (1000 * 60);

  // visitor overstayed
  if(delta > stayDuration) {
    const message = `Note: ${visitorName}, you have overstayed your indicated time on-site.`;
    await job.attach({ label: 'Overstayed', value: message });
  }

  res.send({});
});

// sign-in duration value validation
app.post('/validate-me', (req, res) => {
  const {
    envoy: {
      payload: {
        STAY_DURATION,
      },
    }
  } = req;

  // is STAY_DURATION parsable as a numeric integer?
  const parsedStayDuration = STAY_DURATION - 0

  // no -- fail
  if(isNaN(parsedStayDuration)) {
    res.sendFailed("Value must be a numeric integer between 0 and 180");
  }
  // yes -- success
  else {
    res.send({
        STAY_DURATION: parsedStayDuration
    });
  }
});

// test connection
app.use(function (req, res, next) {
  console.log('Time:', Date.now())
  next()
});

// use middleware
app.use(errorMiddleware());

// create server
const listener = app.listen(process.env.PORT || 0, () => {
  console.log(`Listening on port ${listener.address().port}`);
});