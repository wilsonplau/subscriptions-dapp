# Design Pattern Decisions

## Implementation of Subscriptions - Withdrawal Pattern

The subscription pattern has been invested quite a bit in the context of blockchain. Kevin Owocki proposed a number of solutions in one of his articles, and even proposed an EIP.

[Subscription Services on the Blockchain: ERC-948 - ConsenSys Media](https://media.consensys.net/subscription-services-on-the-blockchain-erc-948-6ef64b083a36)

I do not purport that my implementation of subscriptions should be standardized in anyway, but is a proof-of-concept for a subscription pattern that might work. This system assumes and optimized for several factors:

1) We believe the the gas costs of processing individual subscriptions should be the onus of the owner of the Subscription. This is analogous to credit card processing fees – consumers don't expect to pay for transaction costs when payments are processed. The only exception is upon subscribe, but users need to initiate that transaction in any scenario anyways. 

2) It does not require staking, but it does require the subscriber to keep a wallet funded at any given time, and the onus is on them to do so. We do not believe this to be a particularly onerous, as the user is able to fund or withdraw money from this contract at will.

3) We believe it is important to standardize a set of contracts that is usable across a large number of applications, and so the contracts are not particularly opinionated outside of this withdrawal pattern.

We use a withdraw pattern simply because it is the simplest way to execute, and the use of a pair of contracts in order to facilitate a standardized authorization and withdrawal pattern is the key behind this subscription design. A withdrawal pattern is also safest, because we are able to enforce expected conditions on the wallet being withdrawn from to revert or throw errors on any unexpected conditions upon a withdraw request (a change in price or an unauthorized address, for example).

## Implementation of Factory Pattern

Factory contracts are a fairly common design pattern in Solidity development. The use of a factory contract allows individuals to have full control over the functionality of their individual contracts and hold balances in those contracts, but also ensures for a standardized implementation of a contract that meets a certain standard, whether or not that be a simple ERC-20 token or contracts like SubscriptionWallet and SubscriptionManager that ensures a certain level of functionality when interacting with contracts of the same / compatible type.

## **Implementation of External Calls**

Subscription functions are implemented on the wallet level, so that state can be updated on both the SubscriptionWallet side and the SubscriptionManager side. This syncing of state across both of those calls ensures that a user has full control over his or her subscriptions settings at any given time, instead of relying on a single state on the SubscriptionManager.

The contracts automatically keep track of changes between the parameters of the subscription - most notably, a change in price, for example – that requires reauthorization by the user in order to have the subscription continue to be active. Both sides cannot unilaterally change important data parameters that could be abused.

All of these functions are implemented as contract calls instead of low-level call transactions so they automatically throw errors and revert upon failure.

## Implementation of Restricted Access

Restricted access is also a common pattern that is used in many smart contracts. There are a number of functions that are reserved for the owner to use and a different set of function that are reserved for a complementary SubscriptionWallet / SubscriptionManager contract to use. This is also implemented across a few getter functions that allows different levels of information to be accessed by the owner of the subscription, a subscriber and a random person. For example, an individual can access their subscription information only if they are the actual subscriber; in all other cases, the functions would return default values.

## Implementation of Circuit Breakers

Circuit breakers were implemented in both the SubscriptionWallet and SubscriptionManager contracts. They operate differently, but effectively pause the contract to disallow for any meaningful use.

For the SubscriptionWallet, the pauseWallet function allows all subscription requestPayment functions to fail and revert; on the subscriptionManager side, these transactions should render the subscriptions inactive after the payments fail. The other functions are able to be accessed by the owner when the contract is paused, as they're all functions that are restricted to be used only by the owner of the contract anyways.

For the SubscriptionManager, the owner is able to withdraw the balance of the contract and use the getter functions designed for the owner. However, all external calls to the contract are reverted, and the checkSubscriptionStatus function returns false.

**Note:** Some contracts have public owner variables purely for testing reasons. They should be set to private for non-developmental deployment.
