$(function() {
  $('.cd-nav-trigger').on('click', function(){
    $(this).toggleClass('menu-is-open');
    $('#cd-main-nav div.todo').toggleClass('is-visible');
  });
});
