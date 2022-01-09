const express = require("express");
const router = express.Router();
const { mintNft, fetchNfts } = require("../logic/nft");
var cors = require("cors");

router.options(
  "/mint",
  cors({
    origin: `http://localhost:3000`,
    credentials: true,
  })
);
router.post(
  "/mint",
  cors({
    origin: `http://localhost:3000`,
    credentials: true,
  }),
  async (req, res) => {
    const { pvtkey, accountId, cid } = req.body;

    try {
      const { success, error } = await mintNft({
        pvtkey,
        accountId,
        cid,
      });

      res.send({ success, error });
    } catch (err) {
      res.send({
        error: err.message,
      });
    }
  }
);

router.options(
  "/fetch",
  cors({
    origin: `http://localhost:3000`,
    credentials: true,
  })
);
router.post(
  "/fetch",
  cors({
    origin: `http://localhost:3000`,
    credentials: true,
  }),
  async (req, res) => {
    const { accountId } = req.body;

    try {
      const { data, error } = await fetchNfts({
        accountId,
      });

      res.send({ data, error });
    } catch (err) {
      res.send({
        error: err.message,
      });
    }
  }
);

module.exports = router;
