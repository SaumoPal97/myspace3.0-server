const HederaClient = require('../services/hedera-client');
const DbClient = require('../services/db');
const db = new DbClient();
const {
  AccountId,
  PrivateKey,
  Hbar,
  CustomRoyaltyFee,
  CustomFixedFee,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenMintTransaction,
  TokenAssociateTransaction,
  TransferTransaction,
  ScheduleCreateTransaction,
  ScheduleSignTransaction,
  ScheduleInfoQuery,
} = require('@hashgraph/sdk');
const hederaClient = new HederaClient();

async function initiateNftContract() {
  const hcInstance = await hederaClient.get();

  let nftCustomFee = await new CustomRoyaltyFee()
    .setNumerator(3)
    .setDenominator(10)
    .setFeeCollectorAccountId(AccountId.fromString(process.env.ACCOUNT_ID))
    .setFallbackFee(new CustomFixedFee().setHbarAmount(new Hbar(200)));

  let nftCreate = await new TokenCreateTransaction()
    .setTokenName('Hedera Metaverse Token')
    .setTokenSymbol('HDMETA')
    .setTokenType(TokenType.NonFungibleUnique)
    .setDecimals(0)
    .setInitialSupply(0)
    .setTreasuryAccountId(AccountId.fromString(process.env.ACCOUNT_ID))
    .setSupplyType(TokenSupplyType.INFINITE)
    .setCustomFees([nftCustomFee])
    .setAdminKey(PrivateKey.fromString(process.env.PRIVATE_KEY))
    .setSupplyKey(PrivateKey.fromString(process.env.PRIVATE_KEY))
    .freezeWith(hcInstance)
    .sign(PrivateKey.fromString(process.env.PRIVATE_KEY));

  let nftCreateTxSign = await nftCreate.sign(
    PrivateKey.fromString(process.env.PRIVATE_KEY),
  );
  let nftCreateSubmit = await nftCreateTxSign.execute(hcInstance);
  let nftCreateRx = await nftCreateSubmit.getReceipt(hcInstance);
  let newTokenId = nftCreateRx.tokenId;
  console.log(`- Created NFT with Token ID: ${newTokenId} \n`);
  tokenId = newTokenId;
}

async function mintNft({ accountId, pvtkey, cid }) {
  try {
    const { serialNumber } = await tokenMinterFcn(cid);
    const { success } = await transferNft({ accountId, pvtkey, serialNumber });
    let dbInstance = await db.get();
    let pm1 = new Promise((resolve, reject) => {
      dbInstance.all(
        'SELECT * FROM accounts WHERE account_id=?',
        [accountId],
        (err, rows) => {
          if (err) {
            console.log(err);
            reject({ error: true });
          } else {
            if (rows.length === 0) {
              reject({ error: true });
            } else {
              let newNftString =
                (rows[0].nfts || '').length > 0
                  ? `${rows[0].nfts},${cid}`
                  : `${cid}`;
              dbInstance.run(
                'UPDATE accounts SET nfts=? WHERE account_id=?',
                [newNftString, accountId],
                err => {
                  if (err) {
                    console.log(err);
                    reject({ error: true });
                  } else {
                    resolve({
                      success: true,
                      error: false,
                    });
                  }
                },
              );
            }
          }
        },
      );
      dbInstance.run(
        'UPDATE accounts SET nfts=? WHERE account_id=?',
        [, accountId],
        err => {
          if (err) {
            console.log(err);
            return { error: true };
          }
          return {
            success: true,
            error: false,
          };
        },
      );
    });
    return { success };
  } catch (err) {
    return { error: true };
  }
}

async function tokenMinterFcn(CID) {
  const hcInstance = await hederaClient.get();

  let mintTx = await new TokenMintTransaction()
    .setTokenId(tokenId)
    .setMetadata([Buffer.from(CID)])
    .freezeWith(hcInstance);

  let mintTxSign = await mintTx.sign(
    PrivateKey.fromString(process.env.PRIVATE_KEY),
  );
  let mintTxSubmit = await mintTxSign.execute(hcInstance);
  let mintRx = await mintTxSubmit.getReceipt(hcInstance);
  console.log(
    `- Created NFT ${tokenId} with serial: ${mintRx.serials[0].low} \n`,
  );
  return { serialNumber: mintRx.serials[0].low, success: true };
}

async function transferNft({ accountId, pvtkey, serialNumber }) {
  const hcInstance = await hederaClient.get();

  try {
    let associateAliceTx = await new TokenAssociateTransaction()
      .setAccountId(AccountId.fromString(accountId))
      .setTokenIds([tokenId])
      .freezeWith(hcInstance)
      .sign(PrivateKey.fromString(pvtkey));

    let associateAliceTxSubmit = await associateAliceTx.execute(hcInstance);
    let associateAliceRx = await associateAliceTxSubmit.getReceipt(hcInstance);
    console.log(
      `- NFT association with Alice's account: ${associateAliceRx.status}\n`,
    );
  } catch (err) {
    console.log(err);
  }

  let tokenTransferTx = await new TransferTransaction()
    .addNftTransfer(
      tokenId,
      serialNumber,
      AccountId.fromString(process.env.ACCOUNT_ID),
      AccountId.fromString(accountId),
    )
    .freezeWith(hcInstance)
    .sign(PrivateKey.fromString(process.env.PRIVATE_KEY));

  let tokenTransferSubmit = await tokenTransferTx.execute(hcInstance);
  let tokenTransferRx = await tokenTransferSubmit.getReceipt(hcInstance);

  console.log(
    `\n- NFT transfer from Treasury to Alice: ${tokenTransferRx.status} \n`,
  );

  return { success: true };
}

async function createScheduledTransaction({
  serialNumber,
  accountId1,
  accountId2,
  amt,
  pvtKey,
}) {
  const hcInstance = await hederaClient.get();

  let associateBobTx = await new TokenAssociateTransaction()
    .setAccountId(AccountId.fromString(accountId2))
    .setTokenIds([tokenId])
    .freezeWith(hcInstance)
    .sign(PrivateKey.fromString(pvtkey));

  let associateBobTxSubmit = await associateBobTx.execute(hcInstance);
  let associateBobRx = await associateBobTxSubmit.getReceipt(hcInstance);
  console.log(
    `- NFT association with Bob's account: ${associateBobRx.status}\n`,
  );

  let txToSchedule = new TransferTransaction()
    .addNftTransfer(tokenId, serialNumber, accountId1, acountId2)
    .addHbarTransfer(accountId1, amt)
    .addHbarTransfer(accountId2, -amt);

  let scheduleTx = await new ScheduleCreateTransaction()
    .setScheduledTransaction(txToSchedule)
    .execute(hcInstance);
  let scheduleRx = await scheduleTx.getReceipt(hcInstance);

  let scheduleId = scheduleRx.scheduleId;
  const signature1 = await (await new ScheduleSignTransaction()
    .setScheduleId(scheduleId)
    .freezeWith(hcInstance)
    .sign(pvtKey)).execute(hcInstance);
  const receipt1 = await signature1.getReceipt(hcInstance);
  console.log('The transaction status is ' + receipt1.status.toString());

  const query1 = await new ScheduleInfoQuery()
    .setScheduleId(scheduleId)
    .execute(hcInstance);

  console.log(query1.executed !== null);
}

async function signScheduledTransaction({ scheduleId, pvtKey }) {
  const hcInstance = await hederaClient.get();

  const signature1 = await (await new ScheduleSignTransaction()
    .setScheduleId(scheduleId)
    .freezeWith(hcInstance)
    .sign(pvtKey)).execute(hcInstance);
  const receipt1 = await signature1.getReceipt(hcInstance);
  console.log('The transaction status is ' + receipt1.status.toString());

  const query1 = await new ScheduleInfoQuery()
    .setScheduleId(scheduleId)
    .execute(hcInstance);

  console.log(query1.executed !== null);
}

async function fetchNfts({ accountId }) {
  let dbInstance = await db.get();
  let pm1 = new Promise((resolve, reject) => {
    dbInstance.all(
      'SELECT nfts FROM accounts WHERE account_id=?',
      [accountId],
      (err, rows) => {
        if (err) {
          console.log(err);
          reject({ error: true });
        } else {
          if (rows.length === 0) {
            reject({ error: true });
          } else {
            resolve(rows[0]);
          }
        }
      },
    );
  });
  let result;
  await pm1
    .then(res => {
      result = { data: res };
    })
    .catch(err => {
      result = { error: true };
    });
  return result;
}

module.exports = {
  initiateNftContract,
  mintNft,
  fetchNfts,
  createScheduledTransaction,
  signScheduledTransaction,
};
