const express = require("express");
const router = express.Router();
const { addAccount, updateMetaverseData } = require("../logic/account");
var cors = require("cors");

router.options(
  "/add",
  cors({
    origin: `http://localhost:3000`,
    credentials: true,
  })
);
router.post(
  "/add",
  cors({
    origin: `http://localhost:3000`,
    credentials: true,
  }),
  async (req, res) => {
    const { name, accountId } = req.body;

    try {
      const { data, error } = await addAccount({
        name,
        accountId,
      });
      res.send({ data, error });
    } catch (err) {
      console.log(err);
      res.send({
        error: err.message,
      });
    }
  }
);

module.exports = router;
