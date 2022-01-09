const { Client, AccountId, PrivateKey } = require('@hashgraph/sdk');

function HederaClient() {
  this.client = null;

  this.init = async function() {
    const myAccountId = process.env.ACCOUNT_ID;
    const myPrivateKey = process.env.PRIVATE_KEY;

    if (myAccountId == null || myPrivateKey == null) {
      throw new Error(
        'Environment variables myAccountId and myPrivateKey must be present',
      );
    }

    this.client = await Client.forTestnet();
    await this.client.setOperator(
      AccountId.fromString(myAccountId),
      PrivateKey.fromString(myPrivateKey),
    );
  };

  this.get = async function() {
    if (!this.client) {
      await this.init();
    }
    return this.client;
  };
}

module.exports = HederaClient;
