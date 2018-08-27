const SubscriptionManagerFactory = artifacts.require('./SubscriptionManagerFactory');
const SubscriptionWalletFactory = artifacts.require('./SubscriptionWalletFactory');
const SubscriptionManager = artifacts.require('./SubscriptionManager');
const SubscriptionWallet = artifacts.require('./SubscriptionWallet');

contract('SubscriptionWallet', async (accounts) =>  {
  let subMgrFactory
  let subWalletFactory
  let subMgrAddress
  let subMgr
  let subWalletAddress
  let subWallet

  // Sets up all the contracts needed to test out SubscriptionWallet functionality
  beforeEach ("setup Subscription accounts for each test", async () => {
    //Assign the two factory contracts to variables
    subMgrFactory = await SubscriptionManagerFactory.deployed();
    subWalletFactory = await SubscriptionWalletFactory.deployed();

    //Create a new Subscription Manager and assign to a variable
    let subMgrTxn = await subMgrFactory.createSubscriptionManager("X", 1000, {from: accounts[1]});
    subMgrAddress = subMgrTxn.logs[0].args.addr;
    subMgr = SubscriptionManager.at(subMgrAddress);

    // Create a new subscription wallet, assign to a variable and fund with 1 ETH
    let subWalletTxn = await subWalletFactory.createSubscriptionWallet({from: accounts[6]});
    subWalletAddress = subWalletTxn.logs[0].args.addr;
    subWallet = SubscriptionWallet.at(subWalletAddress);
    let sentAmount = web3.toWei(1, 'ether');
    let sendTxn = await subWallet.sendTransaction({value: sentAmount, from: accounts[6]});
  });

  //Makes sure that a subscriber can property subscribe to a subscription contract.
  it ("Owner should be able to subscribe to a SubscriptionManager contract", async () => {
    let subscribeTxn = await subWallet.subscribe(subMgrAddress, {from: accounts[6]});
    assert.equal(await subWallet.checkSubscriptionStatus(subMgrAddress, {from: accounts[6]}), true, "Status is set to true on SubscriptionManager contract");
  });

  //Makes sure that a subscriber can property unsubscribe from a subscription contract.
  it ("Owner should be able to unsubscribe from a SubscriptionManager contract", async () => {
    let subscribeTxn = await subWallet.subscribe(subMgrAddress, {from: accounts[6]});
    assert.equal(await subWallet.checkSubscriptionStatus(subMgrAddress, {from: accounts[6]}), true, "Status is set to true on SubscriptionManager contract, then...");
    let unsubscriberTxn = await subWallet.unsubscribe(subMgrAddress, {from: accounts[6]});
    assert.equal(await subWallet.checkSubscriptionStatus(subMgrAddress, {from: accounts[6]}), false, "Status is set to false on SubscriptionManager contract");
  });

  //Makes sure that the owner of a SubscriptionWallet can fund his or her own Wallet contract.
  it ("SubscriptionWallet should be able be funded by the owner of the account (or anyone else)", async () => {
    let startingBalance = await web3.eth.getBalance(subWalletAddress).toNumber();
    let sentAmount = parseInt(web3.toWei(1, 'ether'));
    let sendTxn = await subWallet.sendTransaction({value: sentAmount, from: accounts[6]});
    assert.equal(await web3.eth.getBalance(subWalletAddress).toNumber(), startingBalance + sentAmount, "Amount in SubscriptionWallet should equal amount sent + existing balance");
  });

  //Makes sure that a subscriber can access the subscriptionStatus of their subscription.
  it ("Owner should be able to checkSubscriptionStatus of given subscription", async () => {
    let subscribeTxn = await subWallet.subscribe(subMgrAddress, {from: accounts[6]});
    assert.equal(await subWallet.checkSubscriptionStatus(subMgrAddress, {from: accounts[6]}), true, "SubscriptionStatus should equal true after subscribing");
    let unsubscribeTxn = await subWallet.unsubscribe(subMgrAddress, {from: accounts[6]});
    assert.equal(await subWallet.checkSubscriptionStatus(subMgrAddress, {from: accounts[6]}), false, "SubscriptionStatus should equal false after unsubscribing");
  });

  //Makes sure that a subscriber can access the lastPaymentDate of their subscription.
  it ("Owner should be able to checkLastPaymentDate of given subscription", async () => {
    let subscribeTxn = await subWallet.subscribe(subMgrAddress,{from: accounts[6]});
    let subscribeTxnTime = web3.eth.getBlock(subscribeTxn.receipt.blockNumber).timestamp;
    assert.equal(await subWallet.checkLastPaymentDate(subMgrAddress,{from: accounts[6]}), subscribeTxnTime, "lastPaymentDate should equal subscription tranasaction timestamp for now");
  });

});
