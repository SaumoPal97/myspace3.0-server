const DbClient = require('../services/db');
const { getBalance } = require('./hedera-utils');
const { v4: uuidv4 } = require('uuid');
const db = new DbClient();

async function addAccount({ name, accountId }) {
  let balance = await getBalance(accountId);
  let dbInstance = await db.get();
  let pm1 = new Promise((resolve, reject) => {
    dbInstance.all(
      'SELECT * FROM accounts WHERE name=? AND account_id=?',
      [name, accountId],
      (err, rows) => {
        if (err) {
          console.log(err);
          reject({ error: true });
        } else {
          if (rows.length > 0) {
            resolve(Object.assign({}, rows[0], { balance }));
          } else {
            let uuid = uuidv4();
            dbInstance.run(
              'INSERT INTO accounts (name, account_id, uuid) VALUES (?, ?, ?)',
              [name, accountId, uuid],
              err => {
                if (err) {
                  console.log(err);
                  reject({ error: true });
                } else {
                  resolve({
                    name,
                    account_id: accountId,
                    uuid,
                    balance,
                  });
                }
              },
            );
          }
        }
      },
    );
  });
  let result;
  await pm1
    .then(res => {
      console.log('inside res ', res);
      result = { data: res };
    })
    .catch(err => {
      console.log('inside rej ', err);
      result = { error: err };
    });
  return result;
}

async function updateMetaverseData() {}

module.exports = { addAccount, updateMetaverseData };
