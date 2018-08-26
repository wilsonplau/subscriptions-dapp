const SubscriptionManagerFactory = artifacts.require('./SubscriptionManagerFactory');
const SubscriptionManager = artifacts.require('./SubscriptionManager');

contract('SubscriptionManagerFactory', async (accounts) =>  {

  it ("should deploy with owner set to msg.sender", async () => {
    subMgrFactory = await SubscriptionManagerFactory.deployed();
    let factoryOwner = await subMgrFactory.owner();
    assert.equal(accounts[0], factoryOwner, "Subscription Manager owner is set to msg.sender");
  });

  it("should be able to create a new SubscriptionManager contract", async () => {
    let subMgrFactory = await SubscriptionManagerFactory.deployed();
    let result = await subMgrFactory.createSubscriptionManager("X", 1000, {from: accounts[1]});
    newSubMgrAddress = result.logs[0].args.addr;
    assert.equal(await SubscriptionManager.at(newSubMgrAddress).owner(), accounts[1], "SubscriptionManager is deployed and is owned by deploying account.");
  });

  it("should correctly verify SubscriptionManager contracts created with the factory contract", async () => {
    let subMgrFactory = await SubscriptionManagerFactory.deployed();
    let contractCreatedSubMgr = await SubscriptionManager.new("X", 1000, accounts[1], {from: accounts[1]});
    assert.equal(await subMgrFactory.verifySubscriptionManager.call(contractCreatedSubMgr.address), false, "Contract created using new() should be false");
    let factoryCreatedSubMgr = await subMgrFactory.createSubscriptionManager("X", 1000, {from: accounts[1]});
    factoryCreatedSubMgrAddress = factoryCreatedSubMgr.logs[0].args.addr;
    assert.equal(await subMgrFactory.verifySubscriptionManager.call(factoryCreatedSubMgrAddress), true, "Contract created using factory should be true");
  });

  it("should retreive the array of addresses of SubscriptionManager contracts owned by msg.sender", async () => {
    let subMgrFactory2 = await SubscriptionManagerFactory.new();
    let subMgr1 = await subMgrFactory2.createSubscriptionManager("Manager 1", 1000, {from: accounts[3]});
    subMgr1Address = subMgr1.logs[0].args.addr;
    let subMgr2 = await subMgrFactory2.createSubscriptionManager("Manager 2", 1000, {from: accounts[3]});
    subMgr2Address = subMgr2.logs[0].args.addr;
    let subMgrList = await subMgrFactory2.getSubscriptionManagers({from: accounts[3]});
    assert.equal(subMgrList[0], subMgr1Address, "Address 1 is equal");
    assert.equal(subMgrList[1], subMgr2Address, "Address 2 is equal");
  });

  it("should retrieve an empty array if msg.sender doesn't own any accounts", async () => {
    let subMgrFactory = await SubscriptionManagerFactory.deployed();
    let subMgrList = await subMgrFactory.getSubscriptionManagers({from: accounts[4]});
    assert.equal(subMgrList.length, 0, "Addresses with no accounts should return empty array");
  });

});
