const SubscriptionManagerFactory = artifacts.require('./SubscriptionManagerFactory');
const SubscriptionManager = artifacts.require('./SubscriptionManager');
const SubscriptionWalletFactory = artifacts.require('./SubscriptionWalletFactory');
const SubscriptionWallet = artifacts.require('./SubscriptionWallet');

contract('SubscriptionManager', async (accounts) =>  {

  //Sets up a bunch of variables and contracts that are used in all of the below contracts
  let subMgrFactory;
  let subMgrAddress;
  let subMgr;
  let subWalletFactory;
  let subWallet1;
  let subWallet2;
  let subWallet3;

  beforeEach ("setup SubscriptionManager for each test", async () => {
    subMgrFactory = await SubscriptionManagerFactory.deployed();
    let subMgrTxn = await subMgrFactory.createSubscriptionManager("X", 1000, {from: accounts[1]});
    subMgrAddress = subMgrTxn.logs[0].args.addr;
    subMgr = SubscriptionManager.at(subMgrAddress);
  });

  //The owner of a SubscriptionManager should be able to all withdraw funds from the contract.
  it ("Owner should be able to withdraw funds with SubscriptionManager contract", async () => {
    let sentAmount = web3.toWei(1, 'ether');
    subMgr.sendTransaction({value: sentAmount, from: accounts[9]});

    //Get starting balance from owner address
    let startingBalance = web3.eth.getBalance(accounts[1]).toNumber();

    //Get amount of gas used in transaction
    let withdrawTxn = await subMgr.withdrawBalance({from: accounts[1]});
    let gasUsed = withdrawTxn.receipt.cumulativeGasUsed;

    //Get gas price used in transaction
    let gasPriceTxn = await web3.eth.getTransaction(withdrawTxn.tx);
    let gasPrice = gasPriceTxn.gasPrice;

    // Calculate total transaction costs
    let transactionCosts = gasUsed*gasPrice.toNumber();

    //Get ending balance from owner address
    let endingBalance = web3.eth.getBalance(accounts[1]).toNumber();

    assert.equal(sentAmount, (endingBalance + transactionCosts - startingBalance), "Amount in contract is fully withdrawn");
  });

  //The owner of a SubscriptionManager should be able to withdraw a variable amount of funds from the contract.
  it ("Owner should be able to withdraw specified funds with SubscriptionManager contract", async () => {
    let sentAmount = web3.toWei(1, 'ether');
    subMgr.sendTransaction({value: sentAmount, from: accounts[9]});

    //Get starting balance from owner address
    let startingBalance = web3.eth.getBalance(accounts[1]).toNumber();

    //Get amount of gas used in transaction
    let withdrawAmount = web3.toWei(0.5, 'ether');
    let withdrawTxn = await subMgr.withdrawBalanceAmount(withdrawAmount, {from: accounts[1]});
    let gasUsed = withdrawTxn.receipt.cumulativeGasUsed;

    //Get gas price used in transaction
    let gasPriceTxn = await web3.eth.getTransaction(withdrawTxn.tx);
    let gasPrice = gasPriceTxn.gasPrice;

    // Calculate total transaction costs
    let transactionCosts = gasUsed*gasPrice.toNumber();

    //Get ending balance from owner address
    let endingBalance = web3.eth.getBalance(accounts[1]).toNumber();

    assert.equal(withdrawAmount, (endingBalance + transactionCosts - startingBalance), "Specified amount in contract is withdrawn");
  });

  //The owner of a SubscriptionManager should be request a payment from a subscriber after 30 days have passed.
  it ("Owner should be able to requestPayment from SubscriptionWallet", async () => {
    //Create a subscriptionWallet, fund it and subscribe
    subWalletFactory = await SubscriptionWalletFactory.deployed();
    subWalletTxn = await subWalletFactory.createSubscriptionWallet({from: accounts[7]});
    let subWalletAddress = subWalletTxn.logs[0].args.addr
    let subWallet = SubscriptionWallet.at(subWalletAddress);
    let sentAmount = parseInt(web3.toWei(1, 'ether'));
    let sendTxn = await subWallet.sendTransaction({value: sentAmount, from: accounts[7]});
    let subscribeTxn = await subWallet.subscribe(subMgrAddress, {from: accounts[7]});

    //Accelerate time
    web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [31*60*60*24], id: 0})

    //requestPayment
    let startingBalance = await web3.eth.getBalance(subMgrAddress).toNumber();
    let requestPaymentTxn = await subMgr.requestPayment(subWalletAddress, {from: accounts[1]});
    let endingBalance = startingBalance + parseInt(await subMgr.subscriptionPrice());
    assert.equal(await web3.eth.getBalance(subMgrAddress).toNumber(), endingBalance, "Balance should increase by Subscription Price");
  });

  //The owner of a SubscriptionManager should be able to get a list of all of the subscribers.
  it ("Owner should be able to request all subscribers", async () => {
    // Create three subscription wallets and subscribe to SubMgr
    subWalletFactory = await SubscriptionWalletFactory.deployed();
    subWallet1Txn = await subWalletFactory.createSubscriptionWallet({from: accounts[2]});
    subWallet2Txn = await subWalletFactory.createSubscriptionWallet({from: accounts[3]});
    subWallet3Txn = await subWalletFactory.createSubscriptionWallet({from: accounts[4]});
    let subWallet1Address = subWallet1Txn.logs[0].args.addr
    let subWallet2Address = subWallet2Txn.logs[0].args.addr
    let subWallet3Address = subWallet3Txn.logs[0].args.addr
    subWallet1 = SubscriptionWallet.at(subWallet1Address);
    subWallet2 = SubscriptionWallet.at(subWallet2Address);
    subWallet3 = SubscriptionWallet.at(subWallet3Address);
    let sentAmount = web3.toWei(1, 'ether');
    let sendTxn1 = await subWallet1.sendTransaction({value: sentAmount, from: accounts[2]});
    let sendTxn2 = await subWallet2.sendTransaction({value: sentAmount, from: accounts[3]});
    let sendTxn3 = await subWallet3.sendTransaction({value: sentAmount, from: accounts[4]});
    let subscribeTxn1 = await subWallet1.subscribe(subMgrAddress, {from: accounts[2]});
    let subscribeTxn2 = await subWallet2.subscribe(subMgrAddress, {from: accounts[3]});
    let subscribeTxn3 = await subWallet3.subscribe(subMgrAddress, {from: accounts[4]});

    //Run function and assert that it returns the correct addresses
    let subscribers = await subMgr.ownerGetSubscribers({from: accounts[1]});
    assert.equal(subscribers[0], subWallet1Address, "First subscriber is subWallet1");
    assert.equal(subscribers[1], subWallet2Address, "Second subscriber is subWallet2");
    assert.equal(subscribers[2], subWallet3Address, "Third subscriber is subWallet3");
  });

  //The owner of a SubscriptionManager should be able to check the status of any subscriber address.
  it ("Owner should be able to check on the subscription status of any address", async () => {
    subWalletFactory = await SubscriptionWalletFactory.deployed();
    subWallet1Txn = await subWalletFactory.createSubscriptionWallet({from: accounts[2]});
    let subWallet1Address = subWallet1Txn.logs[0].args.addr
    subWallet1 = SubscriptionWallet.at(subWallet1Address);
    let sentAmount = web3.toWei(1, 'ether');
    let sendTxn1 = await subWallet1.sendTransaction({value: sentAmount, from: accounts[2]});
    let subscribeTxn1 = await subWallet1.subscribe(subMgrAddress, {from: accounts[2]});

    let subscriptionStatus = await subMgr.ownerCheckSubscriptionStatus(subWallet1Address, {from: accounts[1]});
    assert.equal(subscriptionStatus, true, "Subscription status should return true if owner calls it");
  });

  //The owner of a SubscriptionManager should be able to check when the last payment was made by a subscriber.
  it ("Owner should be able to check on the lastPaymentDate of any address", async () => {
    subWalletFactory = await SubscriptionWalletFactory.deployed();
    subWallet1Txn = await subWalletFactory.createSubscriptionWallet({from: accounts[2]});
    let subWallet1Address = subWallet1Txn.logs[0].args.addr
    subWallet1 = SubscriptionWallet.at(subWallet1Address);
    let sentAmount = web3.toWei(1, 'ether');
    let sendTxn = await subWallet1.sendTransaction({value: sentAmount, from: accounts[2]});
    let subscribeTxn = await subWallet1.subscribe(subMgrAddress, {from: accounts[2]});
    let subscribeTxnTime = web3.eth.getBlock(subscribeTxn.receipt.blockNumber).timestamp;

    let subscriptionLastPaymentDate = await subMgr.ownerCheckLastPaymentDate(subWallet1Address, {from: accounts[1]});
    assert.equal(subscriptionLastPaymentDate, subscribeTxnTime, "Payment date should be 0 for now");
  });

  //The owner of a SubscriptionManager should be able to change the subscriptionName of a given contract successfully.
  it ("Owner should be able to modify the name of the subscription", async () => {
    let newName = "newName";
    subMgr.ownerUpdateName(newName, {from: accounts[1]});
    assert.equal(newName, await subMgr.subscriptionName(), "Name should be updated");
  });

  //The owner of a SubscriptionManager should be able to change the subscriptionPrice of a given contract.
  it ("Owner should be able to modify the price of the subscription", async () => {
    let newPrice = 1000000;
    subMgr.ownerUpdatePrice(newPrice, {from: accounts[1]});
    assert.equal(newPrice, await subMgr.subscriptionPrice(), "Price should be updated");
  });

});
