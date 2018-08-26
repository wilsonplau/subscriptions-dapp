pragma solidity ^0.4.23;
import './SubscriptionWallet.sol';
import './SafeMath.sol';

/** @title Subscription Manager Contract
  * @author Wilson Lau
*/
contract SubscriptionManager {
  using SafeMath for uint;

  /****** ------------------------------ STATE VARIABLES --------------------------- ******/
  /** @notice All addresses stored refer to SubscriptionWallet addresses
  */
  address public owner;
  string public subscriptionName; // subscriptionName has an automatic getter function
  uint public subscriptionPrice;  // subscriptionPrice has an automatic getter function
  address[] subscriberAddresses;
  bool public suspended;

  struct Subscription {
    address subscriberAddress;
    bool isActive;
    uint lastPaymentDate;
  }

  mapping (address => Subscription) subscribers;

  /****** ------------------------------ EVENTS --------------------------- ******/
  event subscriptionCreated (address _addr);
  event subscriptionNameUpdated (string _newName);
  event subscriptionPriceUpdated (uint _newPrice);
  event subscriptionSuspended (address _addr);
  event subscriptionPaid(address _addr, uint _amount);

  /****** ------------------------------ MODIFIERS --------------------------- ******/
  modifier verifySubscriber (address _addr) { require(subscribers[_addr].subscriberAddress != address(0) ); _;}
  modifier verifyOwner () { require(msg.sender == owner); _; }
  modifier verifyActive () { require (suspended == false); _; }

  /****** ------------------------------ MANAGER FUNCTIONS --------------------------- ******/
  /* @notice These functions are designed to be called by the owner of the SubscriptionManager contract

  /**
    * @notice Constructor initiates the contract with no subscriptions by default
    * @param _subscriptionName - Name of the subscription
    * @param _subscriptionPrice - Price (in wei) of the subscription product
    * @param _owner – Factory contract passes msg.sender to this constructor
  */
  constructor (string _subscriptionName, uint _subscriptionPrice, address _owner) public {
    owner = _owner;
    subscriptionName = _subscriptionName;
    subscriptionPrice = _subscriptionPrice;
  }

  /**
  * @notice Fallback function allows contract to be payable
  */
  function ()
    external
    payable
  {
    if (msg.value > 0) { emit subscriptionPaid(msg.sender, msg.value); }
  }

  /**
    * @notice requestPayments() loops through array of and calls withdraw functions; function can only be called by the owner
    * @dev Some concerns about gas limits - so using an array as input instead of looping through all addresses
    * @param _addrs - Takes an array of addresses to request payments from; front-end should verify and provide array of addresses to request from
  */
  function requestPayments (address[] _addrs)
    public
    verifyOwner
    verifyActive
  {
    // Loop through address array and call requestPayment
    for (uint i = 0; i < _addrs.length; i++) {
      requestPayment(_addrs[i]);
    }
  }

  /**
    * @dev requestPayment() calls withdraw from one subscription using subscription address; function can only be called by the owner
    * @param _addr - address is the Subscriber address
  */
  function requestPayment (address _addr)
    public
    verifyOwner
    verifyActive
    verifySubscriber (_addr)
  {
    // Gets subscription information from the address
    Subscription memory sub = subscribers[_addr];
    // If the today is more than 30 days since the last payment date and subscriber is active
    if (now >= (sub.lastPaymentDate.add(30*60*60*24)) && sub.isActive == true) {
      // Check if the Subscription Wallet contract actually has ETH to avoid the cost of calling the contract if insufficient funds
      if (sub.subscriberAddress.balance >= subscriptionPrice) {
        // Call the requestPayment function on the corresponding Subscription Wallet contract
        SubscriptionWallet(sub.subscriberAddress).requestPayment(subscriptionPrice);
        sub.lastPaymentDate = now;
      } else {
        // Suspends subscriptions if SubscriptionWallet doesn't have enough ETH
        sub.isActive = false;
        emit subscriptionSuspended(_addr);
      }
    }
  }

  /**
    * @notice Allows the owner to withdraw all eth from the contract if no parameter is specified
    * @dev Withdraw is restricted to owner
  */
  function withdrawBalance ()
    public
    verifyOwner
  {
    owner.transfer(address(this).balance);
  }

  /**
    * @notice Allows the owner to withdraw specified amount of eth from the contract if a uint parameter is specified
    * @dev Withdraw is restricted to owner
    * @param _amount is the amount requested from the contract
  */
  function withdrawBalanceAmount (uint _amount)
    public
    verifyOwner
  {
    if (address(this).balance >= _amount) {
      owner.transfer(_amount);
    } else {
      revert();
    }
  }

  /**
    * @notice All requestPayment and subscribe / unsubscribe transactions are ; views are still active
  */
  function toggleSuspendSubscription ()
    public
    verifyOwner
  {
    suspended = !suspended;
  }
  /**
    * @notice Allows the owner to update the price of the subscription
    * @dev Price can be set to 0.
    * @param _price is the new price to change to
  */
  function ownerUpdatePrice (uint _price)
    public
    verifyActive
    verifyOwner
  {
    if (_price >= 0) {
      subscriptionPrice = _price;
      emit subscriptionPriceUpdated (_price);
    }
  }

  /**
    * @notice Allows the owner to update the name of the subscription
    * @param _name is the new name to change the contract to
  */
  function ownerUpdateName (string _name)
    public
    verifyActive
    verifyOwner
  {
    subscriptionName = _name;
    emit subscriptionNameUpdated (_name);
  }


  /**
    * @notice Owner can get an array of all subscribers
    * @return An array of addresses (SubscriptionWallet addresses)
  */
  function ownerGetSubscribers ()
    public
    view
    verifyOwner
    returns (address[])
  {
    return subscriberAddresses;
  }
  /**
    * @notice Allows owner to check subscription status of a specific address
    * @return true if the subscription is active, false if not; reverts if subscriber doesn't exist
  */
  function ownerCheckSubscriptionStatus (address _addr)
    public
    view
    verifyOwner
    verifySubscriber (_addr)
    returns (bool)
  {
    if (subscribers[_addr].isActive == true) {
      return true;
    } else {
      return false;
    }
  }
  /**
    * @notice Allows owner to check subscription status of a specific address
    * @return lastPaymentDate as a uint
  */
  function ownerCheckLastPaymentDate (address _addr)
    public
    view
    verifyOwner
    verifySubscriber (_addr)
    returns (uint)
  {
    if (subscribers[_addr].lastPaymentDate > 0) {
      return subscribers[_addr].lastPaymentDate;
    } else {
      return 0;
    }
  }


  /****** --------------- SUBSCRIBER FUNCTIONS ------------ ******/
  /** These functions are designed to be called by the SubscriptionWallet contract; they correspond with functions on those contracts
  /** Users don't interact with the SubscriptionManager directly.

  /**
    * @notice Adds new subscriber if they don't already exist, set to active if they do already exist
  */
  function subscribe ()
    public
    payable
    verifyActive
    returns (bool)
  {
    if (msg.value == subscriptionPrice) {
      // Reactivate subscription if it already exists
      if (subscribers[msg.sender].lastPaymentDate > 0 ) {
        subscribers[msg.sender].isActive = true;
      } else {
        // Instantiate Subscription in subscribers mapping
        subscribers[msg.sender] = Subscription({
          subscriberAddress: msg.sender,
          isActive: true,
          lastPaymentDate: now
        });
        subscriberAddresses.push(msg.sender);
      }
    //Reverts if subscriptionPrice is incorrect
    } else {
      revert();
    }
  }

  /**
    * @notice Sets subscriber as inactive; only allows msg.sender to initiate this
  */
  function unsubscribe()
    public
    verifyActive
    verifySubscriber (msg.sender)
  {
    subscribers[msg.sender].isActive = false;
  }

  /**
    * @notice Allows subscriber to get the subscriptionStatus of their own subscription
    * @return isActive as a bool
  */
  function checkSubscriptionStatus()
    public
    view
    returns (bool)
  {
    if (suspended == true) {
      return false;
    } else {
      if (subscribers[msg.sender].isActive == true) {
        return true;
      } else {
        return false;
      }
    }
  }

  /**
    * @notice Allows subscriber to the lastPaymentDate of their own Subscription
    * @return lastPaymentDate as a uint
  */
  function checkLastPaymentDate()
    public
    view
    returns (uint)
  {
    if (subscribers[msg.sender].lastPaymentDate > 0) {
      return subscribers[msg.sender].lastPaymentDate;
    } else {
      return 0;
    }
  }

}
