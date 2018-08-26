pragma solidity ^0.4.23;
import './SubscriptionManager.sol';
import './SafeMath.sol';

contract SubscriptionWallet {
  using SafeMath for uint;

  address public owner;
  struct Subscription {
      address subscriptionAddress;
      bool isActive;
      bool isPriceAuthorized;
      uint authorizedPrice;
      uint lastPaymentDate;
  }
  bool private paused;

  mapping (address => Subscription) subscriptions;

  // Modifiers
  modifier verifyOwner () { require(msg.sender == owner); _; }
  modifier verifySubscription () { require(subscriptions[msg.sender].isActive == true); _;}
  modifier stopInEmergency () { if (!paused) _; }

  //Events
  event walletFunded(uint _amount);
  event subscribed(address _addr);
  event unsubscribed(address _addr);

  constructor (address _owner) public {
    owner = _owner;
  }

  /****** --------------- SUBSCRIPTION MANAGER FUNCTION ------------ ******/
  function requestPayment(uint _amount)
    public
    verifySubscription
    stopInEmergency
    returns (bool)
  {
    if (subscriptions[msg.sender].authorizedPrice <= _amount) {
      if (now >= (subscriptions[msg.sender].lastPaymentDate.add(30*60*60*24))) {
        if (address(this).balance >= _amount) {
          subscriptions[msg.sender].lastPaymentDate = now;
          msg.sender.transfer(_amount);
          return true;
        }
      } else {
        revert("Payment was paid fewer than 30 days ago.");
      }
    } else {
      subscriptions[msg.sender].isPriceAuthorized = false;
      revert("Payment requested is greater than authorized price.");
    }
  }

  /****** --------------- SUBSCRIBER FUNCTIONS ------------ ******/
  // Subscriber functions call the same functions as the ones used on the SubscriptionManager contract

  /**
    * @notice Fallback function is used to fund the contract
  */
  function ()
    external
    payable
  {
    if (msg.value > 0) { emit walletFunded(msg.value); }
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

  function togglePauseWallet ()
    public
    verifyOwner
  {
    paused = !paused;
  }

  /**
    ** @notice Subscribe calls the subscribe() function on the SubscriptionManager contract
    ** @param _addr - refers to SubscriptionManager address
  */
  function subscribe (address _addr)
    public
    verifyOwner
  {
    uint subscriptionPrice = SubscriptionManager(_addr).subscriptionPrice();
    subscriptions[_addr] = Subscription (_addr, true, true, subscriptionPrice, 0);
    SubscriptionManager(_addr).subscribe.value(subscriptionPrice)();
    emit subscribed(_addr);
  }

  /**
  */
  function unsubscribe (address _addr)
    public
    verifyOwner
  {
    delete subscriptions[_addr];
    SubscriptionManager(_addr).unsubscribe();
    emit unsubscribed(_addr);
  }

  /**
    * @notice Subscriber need to be able to authorize price changes if SubscriptionManager changes price
    * @param _addr - refers to the SUbscriptionManager address
    * @param _newAuthorizedPrice - refers to the maximum price authorized by the owner to update the subscriptionPrice to
  */
  function authorizePrice (address _addr, uint _newAuthorizedPrice)
    public
    verifyOwner
  {
    //Make sure that the authorized price is greater than current price
    uint currentSubscriptionPrice = SubscriptionManager(_addr).subscriptionPrice();
    if (_newAuthorizedPrice >= currentSubscriptionPrice) {
      // Set actual authorizedPrice to the currentSubscriptionPrice
      subscriptions[_addr].authorizedPrice = currentSubscriptionPrice;
    }
  }

  /**
  */
  function checkSubscriptionStatus(address _addr)
    public
    view
    verifyOwner
    returns (bool)
  {
    return SubscriptionManager(_addr).checkSubscriptionStatus();
  }

  function checkLastPaymentDate(address _addr)
    public
    view
    verifyOwner
    returns (uint)
  {
    return SubscriptionManager(_addr).checkLastPaymentDate();
  }

  /**
    * @notice Subscriber need to be able to authorize price changes if SubscriptionManager changes price
  */
  function checkLastPaymentInfo(address _addr)
    public
    view
    verifyOwner
    returns (address, bool, uint)
  {
    return (_addr, SubscriptionManager(_addr).checkSubscriptionStatus(), SubscriptionManager(_addr).checkLastPaymentDate());
  }


}
