const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../db/mock.db');

function DB() {
  this.db = null;
  this.init = async () => {
    this.db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, err => {
      if (err) return console.log(err);
      console.log('db connected');
    });
    this.db.run(
      `CREATE TABLE IF NOT EXISTS accounts(name, account_id, uuid, metaverse, nfts)`,
      err => {
        if (err) return console.log(err);
      },
    );
  };

  this.get = async () => {
    if (!this.db) {
      await this.init();
    }
    return this.db;
  };

  this.close = async () => {
    await db.close(err => {
      if (err) return console.log(err);
    });
  };
}

module.exports = DB;
