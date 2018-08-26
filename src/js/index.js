$(document).ready(function() {
  $('a.subscription-wallet-nav').click(function() {
    $('.subscription-manager').css("display", "none");
    $('.subscription-wallet').css("display", "grid");
  });
  $('a.subscription-manager-nav').click(function() {
    $('.subscription-wallet').css("display", "none");
    $('.subscription-manager').css("display", "grid");
  });

  $(".btn-make-sub-mgr").click(function() {
    if ( $('.create-subscription-manager-form-wrapper').css("display") == "flex" ) {
      $('.create-subscription-manager-form-wrapper').css("display", "none");
    } else {
      $('.create-subscription-manager-form-wrapper').css("display", "flex");
    }
  });

  $('.create-subscription-manager-form').submit(function() {
    event.preventDefault();
    var values = $('form').serializeArray();
    Handlers.createSubscriptionManager(values[0].value, values[1].value);
  });


});
