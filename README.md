# README

**Description:** A generalized ETH-based subscription model / application.

The application is designed to be integrated in different parts of the web (you should be able to just add a bit of web3 javascript to add a subscription to your website), but this prototype shows a simple backend that allows people to manage the personal SubscriptionWallets or SubscriptionManagers that they own and control.

This uses 4 contracts – two factory contracts for SubscriptionWallet and SubscriptionManager respectively. This allows individuals to permissionlessly create either for their own use. The SubscriptionWallet and SubscriptionManager contracts are designed to be complementary and rely on each others' functions to operate correctly.

*User Stories - Subscriber*

A subscriber opens the web app. The contract recognizes their address and shows them the various subscription wallets that they own. (There's no real purpose to owning multiple wallets, but regardless).

The app shows them a list of all of the subscriptions that are available on the platform. Imagine these are different services, like Netflix or Spotify. They can see whether or not they are actively subscribed to the subscription, choose to subscribe if they'd like, and also the price of the subscription and when they last paid for the subscription. When they subscribe, they are authorizing the subscription provider to withdraw an authorized amount of ETH from this wallet every 30 days.

When they create a new Wallet, fund a wallet, subscribe or unsubscribe, they can use Metamask to sign transactions. The contract state is updated, and the update is pushed to the UI after three confirmations.

Future iterations of this should allow people to dive more deeply into the details of a subscription (perhaps on a separate page).

*User Stories - Subscription Managers*

A service provider is able to create a new contract using the app. They can select a name and a price for their subscription. When they opt to do this, they will need to use Metamask to sign the transaction, and their SubscriptionManager contract will be created.

The app allows the to manage their SubscriptionManager contract. It shows them a list of all of their subscribers, and when their payment was last made. They can request a payment from each of the subscribers if the last payment date is beyond 30 days.

They can also see how much they've collected in their subscriptions in their contract balance and request to withdraw that amount into their personal address.

Future iterations of this can allow for more granular analysis of their subscriber base, automated functions that allow them to keep track of and requestPayments from their subscribers, and perhaps easier integration of a subscribe functionality into any website.

# Setup Requirements

This project requires ganache-cli and lite-server.

## 1. Setup Ganache CLI

Please start ganache-cli with a block gas price limit that is greater than 9999999. That should be able to guarantee that all transactions on this App will go through. Contract executions don't take this much gas, but we use this maximum just a precaution. Please use the below parameter to launch ganache-cli:

    ganache-cli -l 9999999

## 2. Setup Metamask

Please use the Mnemonic provided by ganache-cli to set up your Metamask wallet in your preferred browser of choice. Press the Metamask icon, logout and press "Import using account seed phrase. Please also reset Metamask by going into Settings > Reset Account. There are known errors as a result of Metamask caching the nonce count.

## 3. Setup Truffle

Run truffle migrate to instantiate the initial factory contracts and to create the JSON ABIs.

    truffle migrate

**Note on 'truffle-test'** – There are 23 tests that are implemented in this project. There are two tests that occasionally fail due to imprecise gas price estimations being returned. The GasPrice variable returned is sometimes off by 1 and returns a balance that is off by a small amount. The two tests in question are below: 

- Owner should be able to withdraw funds with SubscriptionManager contract
- Owner should be able to withdraw specified funds with SubscriptionManager contract

## 4. Start lite-server

This is what lite-server recommends for a development-based install:

    npm install lite-server --save-dev
    npm run dev
