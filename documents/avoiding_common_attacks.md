# Avoiding Common Attacks

## Race Conditions

All external transactions are called last, with the exception of event emissions and the requestTransfer function. This is simply because the lastPaymentDate needs to be modified after the function call, as function checks against lastPaymentDate in order to proceed with the transaction.

There are three functions that are at-risk of risk conditions, largely because they involve transfers of ETH.

- **1) SubscriptionWallet.Subscribe()** – The function is initiated by a subscriber wanting to subscribe to something. It is designed as a function that does require an external function, but only to ensure state is updated across both contracts. There is no risk of re-entrancy, as there is no motivation or benefit to pay a Subscription multiple times. There is also no risk of cross-function race, as there are no other functions that set isActive to true on the SubscriptionManager side. The contract automatically reverts in all failed conditions.
- **2) SubscriptionManager.RequestPayment()** – There is motivation for the owner of a SubscriptionManager function to call this multiple times to try to game the timing. The main protection is that lastPaymentDate is updated before transferring any amount back to the owner. If the function is called again, it should revert because it falls the lastPaymentDate condition. There is also no risk of a cross-function race as there are no other functions that can modify lastPaymentDate outside of this function. The contract automatically reverts in all failed conditions.
- **3) SubscriptionManager.withdraw() or SubscriptionWallet.withdraw()** – There is very little risk here of race conditions. The only caller is the owner, and there is a finite amount of ether in the contract.

## Integer Overflow

We implemented SafeMath for the very little math that is used in these contracts. This ensures against integer overflow in those specific cases.

Functions have also been checked for negative values where relevant. For example,

- SubscriptionManager.ownerUpdatePrice() checks if the new price is negative before updating.
- All fallback functions check for msg.value > 0

## DoS Attacks

There is only one function that implements a looped array with indefinite length, which is a function that can only be called by the SubscriptionManager contract owner, given a set of arrays. If this exceeds the block gas limit, it will simply fail and require the owner to pay the gas costs for the failed transaction and try again.

There are some potential issues with the contract functions requiring too much gas in general, and that is something that is worth investigating further before deployment in any more meaningful capacity.

## Timestamp Dependence

There is some timestamp dependence because these contracts use the now function in order to record when last payments were made. However, we don't believe this to be a massive risk because the contract checks for 30 day periods of time for the next payment. Exact time is less important than just the date of the transaction.
