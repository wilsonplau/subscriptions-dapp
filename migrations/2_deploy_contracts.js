var SubscriptionManagerFactory = artifacts.require("./SubscriptionManagerFactory.sol");
var SubscriptionWalletFactory = artifacts.require("./SubscriptionWalletFactory.sol");

module.exports = function(deployer) {
  deployer.deploy(SubscriptionManagerFactory);
  deployer.deploy(SubscriptionWalletFactory);
};
