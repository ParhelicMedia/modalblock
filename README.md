modalBlock
==========

modalBlock is a jQuery plugin which allows you to display any block element as modal "popup" on the page, while hiding the rest of the content while the modal is displayed. The most common use for this is when displaying a section of content that the user must address before continuing on the rest of the page. This plugin is unique as it has the ability to create a modal over a specific element, as well as the entire page. It also has the ability to "bubble" multiple modals, by queuing the display of a modal if there is currently one it view. This makes it ideal for displaying notifications from an asyncronous web application, where it is not guaranteed that only one notification box would be displayed at any given time.

Basic usage example:

    //Initialize modalBlock() on the container. Use any block object, or "document" for the whole page.
    $("document").modalBlock();
    
    //Show a block object as a modal.
    $("document").modalBlock("show", "myBlock");
    
    //Hide the modal from view.
    $("document").modalBlock("hide");

[View more examples and demo](http://jmack.parhelic.com/archive/github/modalBlock/example_01/)