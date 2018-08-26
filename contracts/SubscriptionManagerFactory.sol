pragma solidity ^0.4.23;
import './SubscriptionManager.sol';

/** @title Subscription Manager Factory Contract
*/
contract SubscriptionManagerFactory {
  address public owner; // Owner is the person deploying the SubscriptionManagerFactory contract
  mapping (address => address[]) created; // Owner address to SubscriptionManager contract address
  mapping (address => bool) isSubscriptionManager; // List of SubscriptionManager contract addresses
  address[] subscriptionManagers;

  /**
    * @notice - Constructor doesn't do much. Just instantiates the contract with the owner.
  */
  constructor () public {
    owner = msg.sender;
  }

  event newSubscriptionManagerCreated(address addr);

  /** PUBLIC FUNCTIONS **/
  /**
    * @notice Creates a SubscriptionManager contract for the person who calls this; takes same inputs as SubscriptionManager Constructor
    * @param _subscriptionName - Name of the subscription
    * @param _subscriptionPrice - Price (in wei) of the subscription product
  */
  function createSubscriptionManager (string _subscriptionName, uint _subscriptionPrice)
    public
  {
    SubscriptionManager newSubscriptionManager = new SubscriptionManager(_subscriptionName, _subscriptionPrice, msg.sender);
    created[msg.sender].push(newSubscriptionManager);
    isSubscriptionManager[newSubscriptionManager] = true;
    subscriptionManagers.push(newSubscriptionManager);
    emit newSubscriptionManagerCreated(newSubscriptionManager);
  }

  function getAllSubscriptions()
    public
    view
    returns (address[])
  {
    return subscriptionManagers;
  }

  /**
    * @notice Allows users to retrieve addresses of all the contracts they've created
    * @return Returns as an array of addresses; is empty if msg.sender has never created SubscriptionManager contract
  */
  function getSubscriptionManagers ()
    public
    view
    returns (address[])
  {
    return created[msg.sender];
  }

  /**
    * @notice Allows outside contracts to verify if contracts originated from this Factory contract
    * @param _addr - Address of the contract that is being verified
    * @return Returns true if found; false if not
  */
  function verifySubscriptionManager(address _addr)
    public
    view
    returns (bool)
  {
    return isSubscriptionManager[_addr];
  }

}
