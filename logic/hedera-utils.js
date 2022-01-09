const HederaClient = require('../services/hedera-client');
const { AccountBalanceQuery, AccountId } = require('@hashgraph/sdk');
const hederaClient = new HederaClient();

async function getBalance(accountId) {
  const hcInstance = await hederaClient.get();
  let acc = accountId
    ? accountId
    : AccountId.fromString(process.env.ACCOUNT_ID);

  const balance = await new AccountBalanceQuery()
    .setAccountId(acc)
    .execute(hcInstance);

  console.log(
    'account',
    acc.toString(),
    ' balance is ',
    balance.hbars.toString(),
  );
  return balance.hbars.toString();
}

module.exports = {
  getBalance,
};
