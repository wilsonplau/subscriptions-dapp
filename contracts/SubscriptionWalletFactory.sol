import './SubscriptionWallet.sol';
pragma solidity ^0.4.23;

contract SubscriptionWalletFactory {
  address public owner;
  mapping (address => address[]) private created;
  mapping (address => bool) private isSubscriptionWallet;

  event newSubscriptionWalletCreated(address addr);

  constructor() public {
    owner = msg.sender;
  }

  function createSubscriptionWallet()
    public
  {
    SubscriptionWallet newSubscriptionWallet = new SubscriptionWallet(msg.sender);
    created[msg.sender].push(address(newSubscriptionWallet));
    isSubscriptionWallet[address(newSubscriptionWallet)] = true;
    emit newSubscriptionWalletCreated(newSubscriptionWallet);
  }

  /**
    * @notice Allows outside contracts to verify if contracts originated from this Factory contract
    * @param _addr - Address of the contract that is being verified
    * @return Returns true if found; false if not
  */
  function verifySubscriptionWallet(address _addr)
    public
    view
    returns (bool)
  {
    if (isSubscriptionWallet[_addr] == true) {
      return true;
    } else {
      return false;
    }
  }

  /**
    * @notice Returns all subscriptionWallets owned by msg.sender
  */
  function getSubscriptionWallets()
    public
    view
    returns (address[])
  {
    return created[msg.sender];
  }

}
