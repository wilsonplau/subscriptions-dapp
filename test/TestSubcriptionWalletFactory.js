const SubscriptionWalletFactory = artifacts.require('./SubscriptionWalletFactory');
const SubscriptionWallet = artifacts.require('./SubscriptionWallet');


contract('SubscriptionWalletFactory', async (accounts) =>  {

  //Test simply tests whether or not the Factory contract successfully deploys and sets owner as msg.sender.
  it ("should deploy with owner set to msg.sender", async () => {
    let subWalletFactory = await SubscriptionWalletFactory.deployed();
    let walletOwner = await subWalletFactory.owner();
    assert.equal(accounts[0], walletOwner, "SubscriptionWalletFactory owner is set to msg.sender");
  });

  /**
    * Test makes sure that the Factory aspect of the function works - does it create a new SubscriptionWallet contract successfully?
    * Important that the owner of the SubscriptionWallet contract is the person who called the createSubscriptionWallet function and not the factory contract
    * Important that the address of this new SubscriptionWallet contract is emitted in the event logs.
  */
  it("should be able to create a new SubscriptionWallet contract", async () => {
    let subWalletFactory = await SubscriptionWalletFactory.deployed();
    let result = await subWalletFactory.createSubscriptionWallet({from: accounts[5]});
    newSubWalletAddress = result.logs[0].args.addr;
    assert.equal(await SubscriptionWallet.at(newSubWalletAddress).owner(), accounts[5], "SubscriptionWallet is deployed and is owned by deploying account.");
  });

  //Test makes sure that the verification function is working and that the factory is storing the right subscriptionWallet addresses
  it("should correctly verify SubscriptionWallet contracts created with the factory contract", async () => {
    let subWalletFactory = await SubscriptionWalletFactory.deployed();
    let contractCreatedSubWallet = await SubscriptionWallet.new(accounts[0]);
    assert.equal(await subWalletFactory.verifySubscriptionWallet.call(contractCreatedSubWallet.address), false, "Contract created using new() should be false");
    let factoryCreatedSubWallet = await subWalletFactory.createSubscriptionWallet();
    factoryCreatedSubWalletAddress = factoryCreatedSubWallet.logs[0].args.addr;
    assert.equal(await subWalletFactory.verifySubscriptionWallet.call(factoryCreatedSubWalletAddress), true, "Contract created using factory should be true");
  });

  //Makes sure that the owner of a wallet can access their list of wallets
  it("should retrieve an array of wallets owned by msg.sender", async () =>  {
    let subWalletFactory = await SubscriptionWalletFactory.deployed();
    let subWallet1Txn = await subWalletFactory.createSubscriptionWallet({from : accounts[2]});
    let subWallet2Txn = await subWalletFactory.createSubscriptionWallet({from : accounts[2]});
    let subWallet3Txn = await subWalletFactory.createSubscriptionWallet({from : accounts[2]});
    let subWallet1Address = subWallet1Txn.logs[0].args.addr;
    let subWallet2Address = subWallet2Txn.logs[0].args.addr;
    let subWallet3Address = subWallet3Txn.logs[0].args.addr;
    let subscriptionWallets = await subWalletFactory.getSubscriptionWallets({from: accounts[2]});
    assert.equal(subscriptionWallets[0], subWallet1Address, "First address matches");
    assert.equal(subscriptionWallets[1], subWallet2Address, "First address matches");
    assert.equal(subscriptionWallets[2], subWallet3Address, "First address matches");
  });

  //Makes sure that someone who is not the owner of the wallet can't access a list of wallets owned by other accounts
  it("should retreive an empty array if owner doesn't own at SubscriptionWallets", async () => {
    let subWalletFactory = await SubscriptionWalletFactory.deployed();
    let subscriptionWallets = await subWalletFactory.getSubscriptionWallets({from: accounts[3]});
    assert.equal(subscriptionWallets.length, 0, "Empty array is returned");
  });


});
