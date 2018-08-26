var App = {
  web3Provider: null,
  networkId: 0,
  accounts: {},
  contracts: {},
  subscriptionWallets: [],
  subscriptionManagers: [],
  subscriptions: [],
  subscribers: [],
  subscriptionWalletPosition: 0,
  subscriptionManagerPosition: 0,
  subscriptionStatus: {},
  subscriptionName: {},
  subscriptionPaymentDate: {},

  subscriptionWalletsArrayInitialized: false,
  subscribersArrayInitialized: false,
  subscriptionsArrayInitialized: false,
  subscriptionManagersArrayInitialized: false,

  initWeb3: function() {
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
    }
    web3 = new Web3(App.web3Provider);
    web3.eth.getAccounts().then(function(result) {
      App.accounts = result;
      web3.eth.net.getId().then(function(result) {
        App.networkId = result;
        App.init();
      });
    });
  },

  init: function() {
    App.initContracts();
    App.initSubscribers();
    App.initSubscriptionData();
    App.initSubscriberData();
    View.initEssentialUI();
    View.initConditionalUI();
  },

  initContracts: function() {

    $.getJSON('SubscriptionManagerFactory.json', function(data) {
      var subMgrFactoryABI = data.abi;
      var subMgrFactoryAddress = data.networks[App.networkId].address;
      App.contracts.subMgrFactory = new web3.eth.Contract(subMgrFactoryABI, subMgrFactoryAddress);
      SubscriptionManagerFactory.getSubscriptionManagers();
      SubscriptionManagerFactory.getAllSubscriptions();
    });

    $.getJSON('SubscriptionWalletFactory.json', function(data) {
      var subWalletFactoryABI = data.abi;
      var subWalletFactoryAddress = data.networks[App.networkId].address;
      App.contracts.subWalletFactory = new web3.eth.Contract(subWalletFactoryABI, subWalletFactoryAddress);
      SubscriptionWalletFactory.getSubscriptionWallets();
    });

    $.getJSON('SubscriptionWallet.json', function(data) {
      App.contracts.subWalletABI = data.abi;
    });

    $.getJSON('SubscriptionManager.json', function(data) {
      App.contracts.subMgrABI = data.abi;
    });

  },
  initSubscribers: function() {
    if (App.subscriptionManagersArrayInitialized == true && App.subscriptionManagers.length > 0 && App.contracts.subMgrABI !== undefined) {
      SubscriptionManager.ownerGetSubscribers();
    } else {
      setTimeout(App.initSubscribers, 25);
    }
  },
  initSubscriptionData: function() {
    if (App.subscriptionsArrayInitialized == true && App.contracts.subMgrABI !== undefined && App.contracts.subWalletABI !== undefined) {
      App.subscriptions.forEach(function(subscriptionAddress, position) {
        SubscriptionManager.checkSubscriptionName(subscriptionAddress);
        if (App.subscriptionWallets.length > 0) {
          SubscriptionWallet.checkSubscriptionStatus(subscriptionAddress);
        }
      });
    } else {
      setTimeout(App.initSubscriptionData, 25);
    }
  },
  initSubscriberData: function() {
    if (App.subscribersArrayInitialized == true && App.contracts.subMgrABI !== undefined) {
      App.subscribers.forEach(function(subscriberAddress, position) {
        SubscriptionManager.ownerCheckLastPaymentDate(subscriberAddress);
      });
    } else {
      setTimeout(App.initSubscriberData, 25);
    }
  }

}

//Replicating SubscriptionWalletFactory functions in JS
var SubscriptionWalletFactory = {

  createSubscriptionWallet: function() {
    App.contracts.subWalletFactory.methods.createSubscriptionWallet().send({from: App.accounts[0], gas: 9999999})
    .on("confirmation", function(confirmationNumber, receipt) {
      if (confirmationNumber == 3) {
        console.log("createSubscriptionWallet" + confirmationNumber + receipt);
        SubscriptionWalletFactory.getSubscriptionWallets();
      }
    });
  },

  getSubscriptionWallets: function() {
    App.contracts.subWalletFactory.methods.getSubscriptionWallets().call({from: App.accounts[0]})
    .then(function(result) {
      App.subscriptionWallets = result;
      App.initSubscriptionData();
      View.displaySubscriptionWallets();
      console.log(App.subscriptionWallets);
    });
  }
}

//Replicating SubscriptionManagerFactory functions in JS
var SubscriptionManagerFactory = {
  createSubscriptionManager: function(name, price) {
    App.contracts.subMgrFactory.methods.createSubscriptionManager(name, price).send({from: App.accounts[0], gas: 9999999})
    .on("confirmation", function(confirmationNumber, receipt) {
      if (confirmationNumber == 3) {
        console.log("createSubscriptionManager:" + confirmationNumber + receipt);
        SubscriptionManagerFactory.getSubscriptionManagers();
      }
    });
  },

  getAllSubscriptions: function() {
    App.contracts.subMgrFactory.methods.getAllSubscriptions().call({from: App.accounts[0]})
    .then(function(result) {
      App.subscriptions = result;
      App.subscriptionsArrayInitialized = true;
      View.displaySubscriptions();
    });
  },

  getSubscriptionManagers: function() {
    App.contracts.subMgrFactory.methods.getSubscriptionManagers().call({from: App.accounts[0]})
    .then(function(result) {
      App.subscriptionManagers = result;
      App.subscriptionManagersArrayInitialized = true;
      View.displaySubscriptionManagers();
    });
  }
}

//Replicating SubscriptionManager functions in JS
var SubscriptionManager = {
  requestPayment: function(address) {
    var subManagerInstance = new web3.eth.Contract(App.contracts.subMgrABI, App.subscriptionManagers[App.subscriptionManagerPosition])
    subManagerInstance.methods.requestPayment(address).send({from: App.accounts[0], gas: 9999999})
    .on("confirmation", function(confirmationNumber, receipt) {
      console.log("requestPayment:" + confirmationNumber + receipt);
      View.updateWalletBalance(address);
    });
  },
  withdrawBalanceAmount: function(amount) {
    var address = App.subscriptionManagers[App.subscriptionManagerPosition];
    var subManagerInstance = new web3.eth.Contract(App.contracts.subMgrABI, address)
    subManagerInstance.methods.withdrawBalanceAmount(amount).send({from: App.accounts[0], gas: 99999999})
    .on("confirmation", function(confirmationNumber, receipt) {
      if (confirmationNumber == 3) {
        console.log("withdrawBalanceAmount" + amount + confirmationNumber + receipt);
        View.updateWalletBalance(address);
      }
    });
  },
  withdrawBalance: function() {
    var address = App.subscriptionManagers[App.subscriptionManagerPosition];
    var subManagerInstance = new web3.eth.Contract(App.contracts.subMgrABI, address)
    subManagerInstance.methods.withdrawBalance().send({from: App.accounts[0], gas: 9999999})
    .on("confirmation", function(confirmationNumber, receipt) {
      if (confirmationNumber == 3) {
        console.log("withdrawBalance" + confirmationNumber + receipt);
        View.updateWalletBalance(address);
      }
    });
  },
  ownerUpdateName: function(name) {
    var subManagerInstance = new web3.eth.Contract(App.contracts.subMgrABI, App.subscriptionManagers[App.subscriptionManagerPosition]);
    subManagerInstance.methods.ownerUpdateName(name).send({from: App.accounts[0], gas: 9999999})
    .on("confirmation", function(confirmationNumber, receipt) {
      console.log("ownerUpdateName:" + name + confirmationNumber + receipt);
      //Other callbacks
    });
  },
  ownerUpdatePrice: function(price) {
    var subManagerInstance = new web3.eth.Contract(App.contracts.subMgrABI, App.subscriptionManagers[App.subscriptionManagerPosition]);
    subManagerInstance.methods.ownerUpdatePrice(price).send({from: App.accounts[0], gas: 9999999})
    .on("confirmation", function(confirmationNumber, receipt) {
      console.log("ownerUpdatePrice:" + name + confirmationNumber + receipt);
      //Other callbacks
    });
  },
  ownerGetSubscribers: function() {
    var subManagerInstance = new web3.eth.Contract(App.contracts.subMgrABI, App.subscriptionManagers[App.subscriptionManagerPosition]);
    subManagerInstance.methods.ownerGetSubscribers().call({from: App.accounts[0], gas: 9999999})
    .then(function(result) {
      App.subscribers = result;
      App.subscribersArrayInitialized = true;
      View.displaySubscribers();
    });
  },
  ownerCheckLastPaymentDate: function(address) {
    var subManagerInstance = new web3.eth.Contract(App.contracts.subMgrABI, App.subscriptionManagers[App.subscriptionManagerPosition]);
    subManagerInstance.methods.ownerCheckLastPaymentDate(address).call({from: App.accounts[0], gas: 9999999})
    .then(function(result) {
      App.subscriptionPaymentDate[address] = result;
      View.updateSubscriptionDate(address, result);
    });
  },
  checkSubscriptionName: function(address) {
    var subManagerInstance = new web3.eth.Contract(App.contracts.subMgrABI, address);
    subManagerInstance.methods.subscriptionName().call({from: App.accounts[0], gas: 9999999})
    .then(function(result) {
      App.subscriptionName[address] = result;
      View.updateSubscriptionName(address, result);
    });
  }
}

//Replicating SubscriptionWallet functions in JS
var SubscriptionWallet = {

  subscribe: function(address) {
    var subWalletInstance = new web3.eth.Contract(App.contracts.subWalletABI, App.subscriptionWallets[App.subscriptionWalletPosition]);
    subWalletInstance.methods.subscribe(address).send({from: App.accounts[0], gas: 9999999})
    .on("confirmation", function(confirmationNumber, receipt) {
      if (confirmationNumber == 3) {
        console.log("Subscribe:" + confirmationNumber + receipt);
        App.subscriptionStatus[address] = true;
        View.updateWalletBalance(address);
        View.updateSubscriptionStatus(address, true);
        View.displaySubscribers();
      }
    });
  },
  unsubscribe: function(address) {
    var subWalletInstance = new web3.eth.Contract(App.contracts.subWalletABI, App.subscriptionWallets[App.subscriptionWalletPosition]);
    subWalletInstance.methods.unsubscribe(address).send({from: App.accounts[0], gas: 9999999})
    .on("confirmation", function(confirmationNumber, receipt) {
      if (confirmationNumber == 3) {
        console.log("Subscribe:" + confirmationNumber + receipt);
        App.subscriptionStatus[address] = false;
        View.updateSubscriptionStatus(address, false);
      }
    });
  },
  checkSubscriptionStatus: function(address) {
    var subWalletInstance = new web3.eth.Contract(App.contracts.subWalletABI, App.subscriptionWallets[App.subscriptionWalletPosition]);
    subWalletInstance.methods.checkSubscriptionStatus(address).call({from: App.accounts[0], gas: 9999999})
    .then(function(result) {
      console.log("checkSubscriptionStatus" + address + result);
      App.subscriptionStatus[address] = result;
      View.updateSubscriptionStatus(address, result);
    });
  },
  checkLastPaymentDate: function(address) {
    var subWalletInstance = new web3.eth.Contract(App.contracts.subWalletABI, App.subscriptionWallets[App.subscriptionWalletPosition]);
    subWalletInstance.methods.checkLastPaymentDate(address).call({from: App.accounts[0], gas: 9999999})
    .then(function(result) {
      console.log("checkLastPaymentDate" + address + result);
      App.subscriptionPaymentDate[address] = result;
      View.updateSubscriptionDate(address, result);
    });
  },
  //Simple implementation takes 1ETH as default
  fundWallet: function() {
    var address = App.subscriptionWallets[App.subscriptionWalletPosition]
    var tx = web3.eth.sendTransaction({from: App.accounts[0], to: address, value: web3.utils.toWei("1", "ether")})
    .on("confirmation", function(confirmationNumber, receipt) {
      if (confirmationNumber == 3) {
        console.log("fundWallet" + confirmationNumber + receipt);
        View.updateWalletBalance(address);
      }
    });
  }
}

//Renders all data stored in App + async renders using call functions
var View = {
  initEssentialUI: function() {
    View.displayAccount();
    $(document).on('click', '.btn-make-sub-wallet', Handlers.createSubscriptionWallet);
  },
  initConditionalUI: function() {
    if (App.subscriptionWallets.length > 0 && App.subscriptionManagers.length > 0) {
      View.displaySubscriptionWallets();
      View.displaySubscriptions();
      View.displaySubscriptionManagers();
      View.displaySubscribers();
    } else {
      setTimeout(View.initConditionalUI, 25);
    }
  },
  displayAccount: function() {
    var accountAddress = document.querySelector('.account-address');
    accountAddress.innerHTML = "<b>Your Address:</b> " + App.accounts[0];
    var accountBalance = document.querySelector('.account-balance');
    web3.eth.getBalance(App.accounts[0]).then(function(result) {
      accountBalance.innerHTML = "<b>Your Balance:</b> " + web3.utils.fromWei(result, "ether") + " ETH";
    });
  },
  displaySubscriptionWallets: function() {
    var walletsDiv = document.querySelector('.wallets-container');
    walletsDiv.innerHTML = '';
    App.subscriptionWallets.forEach(function(walletAddress, position) {

      // Create a div for each individual wallet
      var walletDiv = document.createElement('div');
      walletDiv.id = walletAddress;
      walletDiv.dataset.position = position;
      walletDiv.className = "wallet-module";
      if (position == App.subscriptionWalletPosition) {
        walletDiv.className = "wallet-module active";
      }
      walletDiv.addEventListener("click", function(event) {
        var oldWalletDiv = document.querySelector('.wallet-module.active');
        oldWalletDiv.className = "wallet-module";
        Handlers.selectWallet(parseInt(this.getAttribute("data-position")));
        this.className = "wallet-module active";
      });

      // Add text to the div
      var walletLabel = document.createElement('h1');
      walletLabel.textContent = "Wallet";
      var walletAddressHeading = document.createElement('h2');
      var walletAddressBalance = document.createElement('h3');
      walletAddressHeading.textContent = walletAddress;
      walletAddressBalance.dataset.address = walletAddress;

      //Create a button for funding the wallet
      var walletFundButton = document.createElement('button');
      walletFundButton.textContent = "Fund";
      walletFundButton.id = walletAddress;
      walletFundButton.className = "wallet-fund-button";
      walletFundButton.addEventListener("click", function(event) {
        SubscriptionWallet.fundWallet();
      });

      //Add to list of Wallets
      walletDiv.appendChild(walletLabel);
      walletDiv.appendChild(walletAddressHeading);
      walletDiv.appendChild(walletAddressBalance);
      walletDiv.appendChild(walletFundButton);
      walletsDiv.appendChild(walletDiv);

      //Live Data views
      View.updateWalletBalance(walletAddress);
    });
  },

  // Subscriptions section on the SubcriptionWallet page
  displaySubscriptions: function () {
    var subscriptionsDiv = document.querySelector('.subscriptions-container');
    subscriptionsDiv.innerHTML = '';
    App.subscriptions.forEach(function(subscriptionAddress, position) {
      var subscriptionDiv = document.createElement('div');
      subscriptionDiv.className = "subscription-module";
      subscriptionDiv.dataset.address = subscriptionAddress;

      var subscriptionNameHeading = document.createElement('h4');
      subscriptionNameHeading.className = 'subscriber-name-heading';
      subscriptionNameHeading.dataset.address = subscriptionAddress;
      subscriptionNameHeading.textContent = "";

      var subscriptionAddressHeading = document.createElement('h1');
      subscriptionAddressHeading.textContent = subscriptionAddress;
      subscriptionAddressHeading.dataset.address = subscriptionAddress;

      var subscriptionIsActive = document.createElement('h2');
      subscriptionIsActive.textContent = App.subscriptionStatus[subscriptionAddress];
      subscriptionIsActive.dataset.address = subscriptionAddress;
      subscriptionIsActive.className = "subscription-status-heading";

      var subscribeButton = document.createElement('button');
      subscribeButton.dataset.address = subscriptionAddress;

      // Append to
      subscriptionDiv.appendChild(subscriptionNameHeading);
      subscriptionDiv.appendChild(subscriptionAddressHeading);
      subscriptionDiv.appendChild(subscriptionIsActive);
      subscriptionDiv.appendChild(subscribeButton);
      subscriptionsDiv.appendChild(subscriptionDiv);
    });
  },
  displaySubscriptionManagers: function() {
    var managerDiv = document.querySelector('.managers-container');
    managerDiv.innerHTML = "";
    App.subscriptionManagers.forEach(function(managerAddress, position) {
      var managerModule = document.createElement('div');
      managerModule.dataset.address = managerAddress;
      managerModule.dataset.position = position;
      managerModule.className = "manager-module";
      if (position == App.subscriptionManagerPosition) {
        managerModule.className = "manager-module active";
      }
      managerModule.addEventListener("click", function(event) {
        var oldManagerDiv = document.querySelector('.manager-module.active');
        oldManagerDiv.className = "manager-module";
        this.className = "manager-module active";
        Handlers.selectManager(parseInt(this.getAttribute("data-position")));
      });

      var managerName = document.createElement("h1");
      managerName.className = 'subscriber-name-heading';
      managerName.dataset.address = managerAddress;
      managerName.textContent = "";

      var managerHeading = document.createElement('h2');
      managerHeading.textContent = managerAddress;

      var managerBalance = document.createElement("h3");
      managerBalance.dataset.address = managerAddress;

      var managerWithdrawButton = document.createElement('button');
      managerWithdrawButton.dataset.address = managerAddress;
      managerWithdrawButton.className = "manager-withdraw-button";
      managerWithdrawButton.textContent = "Withdraw Balance";
      managerWithdrawButton.addEventListener("click", function(event) {
        SubscriptionManager.withdrawBalance();
      });

      managerModule.appendChild(managerName);
      managerModule.appendChild(managerHeading);
      managerModule.appendChild(managerBalance);
      managerModule.appendChild(managerWithdrawButton);
      managerDiv.appendChild(managerModule);

      //Run view update functions after everything is added to the dom
      View.updateWalletBalance(managerAddress);
    });
  },
  displaySubscribers: function() {
    var subscribersDiv = document.querySelector('.subscribers-container');
    subscribersDiv.innerHTML = "";
    App.subscribers.forEach(function(address, position) {
      var subscriberModule = document.createElement('div');
      subscriberModule.className = "subscriber-module"
      var subscriberHeading = document.createElement('h1');
      subscriberHeading.textContent = address;

      var subscriberLastPaymentDate = document.createElement('h2');
      subscriberLastPaymentDate.className = "subscriber-date-heading";
      subscriberLastPaymentDate.dataset.address = address;
      subscriberLastPaymentDate.textContent = new Date(parseInt(App.subscriptionPaymentDate[address]*1000));

      // Create button for requestPayment
      var requestPaymentButton = document.createElement('button');
      requestPaymentButton.dataset.address = address;
      requestPaymentButton.className = "request-payment-button";
      requestPaymentButton.textContent = "Request Payment";
      requestPaymentButton.addEventListener('click', function(event) {
        SubscriptionManager.requestPayment(address);
      });

      subscriberModule.appendChild(subscriberHeading);
      subscriberModule.appendChild(subscriberLastPaymentDate);
      subscriberModule.appendChild(requestPaymentButton);
      subscribersDiv.appendChild(subscriberModule);
    });
  },
  updateSubscriptionStatus: function(address, status) {
    var subscriptionStatusHeading = document.querySelector('.subscription-status-heading[data-address="' + address + '"]');
    var subscribeButton = document.querySelector('button[data-address="' + address + '"]');
    if (status == true) {
      subscriptionStatusHeading.innerHTML = "Status: Subscribed";;
      subscribeButton.className = "unsubscribe-button"
      subscribeButton.textContent = "Unsubscribe";
      subscribeButton.addEventListener('click', function(event) {
        SubscriptionWallet.unsubscribe(String(this.getAttribute("data-address")));
      });
    } else {
      subscriptionStatusHeading.innerHTML = "Status: Not Subscribed";
      subscribeButton.textContent = "Subscribe";
      subscribeButton.className = "subscribe-button"
      subscribeButton.addEventListener('click', function(event) {
        SubscriptionWallet.subscribe(String(this.getAttribute("data-address")));
      });
    }
  },
  updateSubscriptionDate: function(address, date) {
    var subscriberDateHeading = document.querySelector('.subscriber-date-heading[data-address="' + address + '"]');
    subscriberDateHeading.innerHTML = "Last Payment Date: " + new Date(parseInt(date*1000)).toLocaleDateString();
  },
  updateSubscriptionName: function(address, name) {
    var subscriberNameHeadingArray = document.querySelectorAll('.subscriber-name-heading[data-address="' + address + '"]');
    subscriberNameHeadingArray.forEach(function(item) {
      item.innerHTML = name;
    });
  },
  updateWalletBalance: function(address) {
    var walletBalanceHeading = document.querySelector('h3[data-address="' + address + '"]');
    web3.eth.getBalance(address).then(function(result) {
      walletBalanceHeading.innerHTML = web3.utils.fromWei(result, "ether") + " ETH";
    });
  },
}

var Handlers = {
  createSubscriptionWallet: function() {
    SubscriptionWalletFactory.createSubscriptionWallet();
  },
  createSubscriptionManager: function(name, price) {
    SubscriptionManagerFactory.createSubscriptionManager(name, web3.utils.toWei(price, "ether"));
  },
  selectWallet: function(value) {
    App.subscriptionWalletPosition = value;
    App.initSubscriptionData();
    View.displaySubscriptions();
  },
  selectManager: function(value) {
    App.subscriptionManagerPosition = value;
    SubscriptionManager.ownerGetSubscribers();
  }
}

App.initWeb3();
