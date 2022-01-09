/* eslint consistent-return:0 import/order:0 */

const express = require("express");
// const logger = require('./logger');
const bodyParser = require("body-parser");

const argv = require("./argv");
const port = require("./port");
// const setup = require("./middlewares/frontendMiddleware");
const isDev = process.env.NODE_ENV !== "production";
const ngrok =
  (isDev && process.env.ENABLE_TUNNEL) || argv.tunnel
    ? require("ngrok")
    : false;
const { resolve } = require("path");
const accountRouter = require("./routes/account");
const nftRouter = require("./routes/nft");
const { initiateNftContract } = require("./logic/nft");
const app = express();

if (!isDev || !!Number(process.env.ENABLE_NGROK)) {
  // enable this if you run behind a proxy like nginx in production
  app.set("trust proxy", 1);
}

console.log(process.env.ACCOUNT_ID, process.env.PRIVATE_KEY);

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// If you need a backend, e.g. an API, add your custom backend-specific middleware here
// app.use('/api', myApi);
app.use("/api/account", accountRouter);
app.use("/api/nft", nftRouter);
global.tokenId = null; // submissionId: addedTime, result

// In production we need to pass these values in instead of relying on webpack
// setup(app, {
//   outputPath: resolve(process.cwd(), "build"),
//   publicPath: "/",
// });

// get the intended host and port number, use localhost and port 3000 if not provided
const customHost = argv.host || process.env.HOST;
const host = customHost || null; // Let http.Server use its default IPv6/4 host
const prettyHost = customHost || "localhost";

// use the gzipped bundle
app.get("*.js", (req, res, next) => {
  req.url = req.url + ".gz"; // eslint-disable-line
  res.set("Content-Encoding", "gzip");
  next();
});

// Start your app.
app.listen(port, host, async (err) => {
  if (err) {
    return console.log(err.message);
    // logger.error(err.message);
  }

  // Connect to ngrok in dev mode
  if (ngrok) {
    let url;
    try {
      url = await ngrok.connect(port);
    } catch (e) {
      return console.log(e);
      // logger.error(e);
    }
    console.log(port, prettyHost, url);
    // logger.appStarted(port, prettyHost, url);
  } else {
    console.log(port, prettyHost);
    // logger.appStarted(port, prettyHost);
  }
});

(async () => {
  initiateNftContract();
})();
