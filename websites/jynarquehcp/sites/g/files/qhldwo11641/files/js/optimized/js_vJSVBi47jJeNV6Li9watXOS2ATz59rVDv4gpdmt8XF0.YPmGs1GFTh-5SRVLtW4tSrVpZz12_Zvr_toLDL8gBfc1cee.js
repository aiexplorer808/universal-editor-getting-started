(function ($, Drupal) {
  'use strict';
  Drupal.behaviors.otsukaParagraphsWrapperTabbedParagraph = {
    attach: function (context) {
      $('.custom-wrapper-type-tabbed > .field--name-field-paragraphs', context).tabs();
    }
  };
})(jQuery, Drupal);
