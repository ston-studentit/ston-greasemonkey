// ==UserScript==
// @name        studis-online
// @namespace   studis-online.de
// @include     http://*.studis-online.de/Fragen-Brett/*
// @require     https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js
// @version     1
// @grant       none
// ==/UserScript==

$.noConflict(); // Konflikte mit Beitragseditor vermeiden

var Page = new Page();
var ThreadOverview = new ThreadOverview();
var Thread = new Thread();
var Post = new Post();

$(document).ready(function() {
    fillPostSubjectIfEmpty();
    keepPrivateMessages();
    removeCurrentNews();
    removeMarkAsReadedLinks();
    removePagingText();
    reducePagingWidth();
    insertLetterToMarkThreadAsRead();
    insertDeleteQuoteButtons();
    scaleImageWidthInThreads();
});

function ThreadOverview() {
    this.markAsReadedLinks = $('a[title~="Punkte)"]');
    this.forumTable = $('.ston-forumtab');
    this.redDotElements = this.forumTable.find("span[title='Neu']");
}

function Page() {
    this.pagingElements = $('.ston-f-paging');
    
    // Ob es sich um die Thread-Übersicht-Seite handelt
    this.isThreadOverview = function() {
        return window.location.pathname === '/Fragen-Brett/list.php';
    };
    
    // Ob es sich um die Private-Message-(Senden)-Seite handelt
    // FIXME: True auf der PrivateMessageOverview
    this.isPrivateMessage = function() {
        //return $('form[action="http://www.studis-online.de/Fragen-Brett/pm.php"]').length === 1;
        return window.location.pathname === '/Fragen-Brett/pm.php';
    };
}

function Thread() {
    this.textblockElements = $('.ston-f-textblock');
    this.markAsReadedLinks = $('a[title~="Punkte)"]');
}

function Post() {
    this.bodyElement = $('#post-body');
    this.subjectInput = $('#phorum_subject');
    this.deleteQuoteButtonWidth = 16;
    this.deleteQuoteButtonHTML = '<span class="gston-delete-quote" style="-user-select: none; float: right"><img src="http://www.bilder-hochladen.net/files/15an-3i-49e7.png" width="' + this.deleteQuoteButtonWidth + '" /></span>';
    this.keepPrivateMessageCheckbox = $('input[name="keep"]');
    
    // Funktion auf allen Quotes ausführen
    this.doForEachQuote = function(forEach) { return this.bodyElement.find('blockquote').each(forEach); };
    
    // Lösch-Button zu allen Zitaten hinzufügen
    this.addDeleteQuoteButtons = function() {
      this.doForEachQuote(function() {
          var postQuoteElement = $(this);
          Post.addDeleteQuoteButton(postQuoteElement);
      });
    }
    
    // Lösch-Button zu einem Zitat hinzufügen
    this.addDeleteQuoteButton = function(blockquote) {
       var deleteQuoteElements = blockquote.find('.gston-delete-quote');
        
       if(deleteQuoteElements.length === 0) {
          var position = blockquote.offset().left - this.bodyElement.offset().left + blockquote.innerWidth() - this.deleteQuoteButtonWidth - 5;
          var deleteButtonElement = $(this.deleteQuoteButtonHTML);

          deleteButtonElement.click(function() {
             blockquote.remove();
          });

          blockquote.children().first().prepend(deleteButtonElement);
       }
    };
    
}

// Füllt den Betreff eines Posts, falls leer
function fillPostSubjectIfEmpty() {
    if(Post.subjectInput.length > 0) {
       let threadSubject = Post.subjectInput.attr('value');
       Post.subjectInput.parent().find('span').text(threadSubject);
    }
}

// Gesendete Nachrichten speichern
function keepPrivateMessages() {
    if(Page.isPrivateMessage()) {
       Post.keepPrivateMessageCheckbox.click();
    }
}

// Entfernt die aktuellen Meldungen aus der Thread-Übersicht
function removeCurrentNews() {
    // TODO Bundle and remove at once
    var newsElement = $('.ston-klein').filter(function() { return $(this).text().indexOf('Aktuelle Meldungen') === 0});
    newsElement.prev().remove(); // <hr>
    newsElement.next().remove(); // <hr>
    newsElement.next().remove(); // <br>
    newsElement.remove(); // news
}


// Entfernt den Hinweistext, auf welcher Seite man sich befindet => 'Seite 1 von 24'
function removePagingText() {
    Page.pagingElements.each(function() {
       let pagingCountTextElement = $(this).children().first();
       if(pagingCountTextElement.text().indexOf('Seite') === 0) {
            pagingCountTextElement.remove();
       }
    });
}

// Zeilenumbruch beim Verkleinern des Browsers weiter hinaus zögern
function reducePagingWidth() {
    Page.pagingElements.each(function() {
       $(this).children().last().css('margin-right', '0px');
    });
}

// Entfernt Thema als Gelesen Markieren in Threads
function removeMarkAsReadedLinks() {
    ThreadOverview.markAsReadedLinks.each(function() {
       $(this).remove(); 
    });
    
    Thread.markAsReadedLinks.each(function() {
        $(this).remove();
    })
}

// Ersetzt "rote Punkte" (== ungelesen) durch Briefe, welche beim Klick, den Thread als gelesen markieren
function insertLetterToMarkThreadAsRead() {
    if(Page.isThreadOverview()) {
       var redDotElements = ThreadOverview.redDotElements;
       
       redDotElements.each(function() {
           var redDotElement = $(this);
           var threadLinkElement = redDotElement.parent();
           var unreadedThreadImageElement = $('<img src="http://www.bilder-hochladen.net/files/15an-3j-7d53.png" style="padding-right: 3px" />');
           unreadedThreadImageElement.click(function() {
               var markThreadReadHref = threadLinkElement.attr('href') + ',markthreadread';
               $.ajax({url: markThreadReadHref, success: function(result) {
                  unreadedThreadImageElement.remove();
               }});
           });
           threadLinkElement.before(unreadedThreadImageElement);
           redDotElement.remove();
       });
    } else {
       console.warn("Es gibt mehr als eine Threadübersicht.");
    }
}

// Button zum Löschen von Zitaten
function insertDeleteQuoteButtons() {
    Post.addDeleteQuoteButtons();
    Post.bodyElement.bind("DOMSubtreeModified", function() {
       Post.addDeleteQuoteButtons();
    })
}

// Breite der Bilder in Beiträgen an die Fenstergröße anpassen
// .ston-f-textblock img { max-width: 100%};
function scaleImageWidthInThreads() {
    var images = Thread.textblockElements.find('img');
    
    images.each(function() {
        $(this).css('max-width', '100%');
    });
}