$(document).ready(function() {
  $("#h1").click(function() { $("#h1").fadeOut(400); });
});

var complete_prefix = "complete_task_";
var delete_prefix = "delete_submission_";
var undo_prefix = "undo_complete_";
var edit_prefix = "edit_task_";
var save_prefix = "save_task_";
var cancel_prefix = "cancel_task_";

function getCookie(name) {
  var cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    var cookies = document.cookie.split(';');
    for (var i = 0; i < cookies.length; i++) {
      var cookie = jQuery.trim(cookies[i]);
      // Does this cookie string begin with the name we want?
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}
var csrftoken = getCookie('csrftoken');

function csrfSafeMethod(method) {
  // these HTTP methods do not require CSRF protection
  return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}
$.ajaxSetup({
  beforeSend : function(xhr, settings) {
    if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
      xhr.setRequestHeader("X-CSRFToken", csrftoken);
    }
  }
});

function showHiddenRows() {
  $(".todos").find('tr').show();
  $(".completedtodos").find('tr').show();
  document.getElementById("clearSearch").style.display = "none";
  $("#searchTaskBox").val("");
}

// FUNCTION TO CREATE A ROW IN HTML BY FETCHING & CLONING TEMPLATE FROM HTML

function addARowToPending(text, taskNumber) {
  // use jquery to fetch template from HTML
  var $row = $(".templatePendingTask");
  // clone the template
  $editableCopy = $row.clone();
  // finding a cell with class pendingTaskText
  var $pendingTaskText = $editableCopy.find(".pendingTaskText");

  console.log(text);
  console.log($pendingTaskText);
  $pendingTaskText.html(text);
  $pendingTaskText.removeAttr("class");
  $editableCopy.attr("data-id", taskNumber);
  $editableCopy.removeAttr("class");
  $(".todos").append($editableCopy);

  // this is the line that means that the button works straight
  // away. Because a new button of class completeTask was added,
  // it needs to be made active using the code below, which finds
  // all .completeTask (including the new one), and assigns them
  // "when clicked" action
  $editableCopy.find('.completeTask').click(markAsDoneAction);
}

function addARowToCompleted(text, taskNumber) {
  // use jquery to fetch template from HTML
  var $row = $(".templateCompletedTask");
  // clone the template
  $editableCopy = $row.clone();
  // use the clone and add number to the tr
  var $completedTaskText = $editableCopy.find(".completedTaskText");
  console.log(text);
  console.log($completedTaskText);
  $completedTaskText.html(text);
  $completedTaskText.removeAttr("class");
  $editableCopy.attr("data-id", taskNumber);
  $editableCopy.removeAttr("class");
  // adds item to completedtodos
  $(".completedtodos").append($editableCopy);
  // removes item from todos
  $(".todos").find('[data-id="' + taskNumber + '"]').remove();

  // this is the line that means that the button works straight
  // away. Because a new button of class completeTask was added,
  // it needs to be made active using the code below, which finds
  // all .completeTask (including the new one), and assigns them
  // "when clicked" action
  $editableCopy.find('.undoCompleteTask').click(undoDone);
  $editableCopy.find('.deleteSubmission').click(markedAsPurged);
}

// ADDING TASKS -------------------------------------------------------

// clicking Add a Task adds a task - at the moment assumed not maintained - will
// be once Enter works fully
$(document).ready(function() {
  $('#addTask').click(function() {
    var toAdd = $('input[name=taskText]').val();
    $(".todos").append('<div class="item">' + toAdd + '</div>');
    $.post("/jquerytodolist/", {task_text : $('input[name=taskText]').val()});
    $('#addTaskBox').val("");
  });
});

// pressing enter when in the addTaskBox adds a task
$(document).ready(function() {
  $('#addTaskBox').keypress(function(event) {
    console.log(event);
    if (event.keyCode == 13) {
      var toAdd = $('input[name=taskText]').val();
      event.preventDefault();

      showHiddenRows();
      // sends POST request to submit task

      if (toAdd !== "") {

        if (toAdd.includes("<")) {
          alert(
              "Your item has not been added to the list. YOU, however, have been added to the Santa's naughty list");

        } else {

          $.post("/jquerytodolist/", {
             submit_task : $("input[name=taskText]").val()
           }).done(function() {
            $.ajax({
              url : "",
              method : "POST",
              data : "lastIDinDatabase",
              success : function(lastIDinDatabaseReturn) {

                addARowToPending(toAdd, lastIDinDatabaseReturn);

                $("#addTaskBox").val("");

                $(".todos")[0].style.display = "table";
                document.getElementById("headingMakePendingVisible")
                    .style.display = "none";

              }
            });
          });
        }
      }
    }
  });
});

// SEARCHING BOX ------------------------------------------------------

// pressing ENTER in the search box
$(document).ready(function() {
  $('#searchTaskBox').keypress(function(event) {
    console.log(event);
    if (event.keyCode == 13) {
      var toSearch = $('input[name=searchText]').val();
      event.preventDefault();

      if (toSearch !== "") {

        // sends POST request to search task
        console.log({
          search_tasks : $("input[name=searchText]").val()
          //  console.log(submit_task);
        });

        if (toSearch.includes("<")) {
          alert(
              "Your item has not been searched for. YOU, however, have been added to the Santa's naughty list");
        }

        else {
          $.ajax({
            url : "",
            method : "POST",
            data : {search_tasks : $("input[name=searchText]").val()},
            success : function(searchResult) {
              console.log(searchResult);
              console.log(searchResult.length);

              // clears removes any search classes from items to stop searches
              // mixing up
              $(document).ready(function() {
                $("#clearSearch").click(showHiddenRows);
              });
              document.getElementById("clearSearch").style.display =
                  "inline-block";

              // if there is at least one matching result
              if (searchResult.length !== 0) {
                // for each result
                $(".todos").find('tr').hide();
                $(".completedtodos").find('tr').hide();

                for (i = 0; i < searchResult.length; i++) {
                  console.log(searchResult[i]);

                  // find the results id
                  var taskID = searchResult[i].id;
                  console.log(taskID);

                  // if its completed status is false
                  if (!searchResult[i].completed) {

                    // go through todos and find the row with that id and assign
                    // it a class of search result WORKS!
                    $(".todos").find('[data-id="' + taskID + '"]').show();

                    console.log($(".todos").find('[data-id="' + taskID + '"]'));

                  }
                  // if its completed status is true

                  else {
                    // go through completedtodos and find the row with that id
                    // and assign it a class of search result WORKS!
                    $(".completedtodos")
                        .find('[data-id="' + taskID + '"]')
                        .show();

                    console.log($(".completedtodos")
                                    .find('[data-id="' + taskID + '"]'));
                  }
                }
              } else {
                $(".noMatchingTasks")[0].style.display = "table";
              }
            }
          });
        }
      }
    }
  });
});

// MARKING TASKS AS COMPLETED ---------------------------------------

var markAsDoneAction = function() {

  var row = $(this).parents("tr");
  var taskNumber = row.attr("data-id");

  $.post("/jquerytodolist/", {"completeIDnr" : taskNumber}).done(function() {
    $.ajax({
      url : "",
      method : "POST",
      data : {"taskNameFetching" : taskNumber},
      success : function(taskNameFetched) {
        $(".completedtodos")[0].style.display = "table";
        document.getElementById("headingMakeCompletedVisible").style.display =
            "none";

        addARowToCompleted(taskNameFetched, taskNumber);

        // deletes the item from todos, adds it to completedtodos

        $(".completedtodos").find('[data-id="' + taskNumber + '"]').append();
        $(".todos").find('[data-id="' + taskNumber + '"]').remove();

        // makes todos table invisible if it's empty
        if ($(".todos")[0].rows.length === 0) {
          $(".todos")[0].style.display = "none";
          document.getElementById("headingMakePendingVisible").style.display =
              "table";
        }
      }
    });
  });
};

// clicking Done changes status completed to True
$(document).ready(function() { $(".completeTask").click(markAsDoneAction); });

// UNDOING -----------------------------------------------------------

var undoDone = function() {

  var row = $(this).parents("tr");
  var taskNumber = row.attr("data-id");

  // removes the row from the completed tasks table
  $(".completedtodos").find('[data-id="' + taskNumber + '"]').remove(); // works

  // updates the database
  $.post("/jquerytodolist/", {"undocompleteIDnr" : taskNumber});

  // make ajax request to fetch the conent of the name part
  $.post("/jquerytodolist/", {"completeIDnr" : taskNumber}).done(function() {
    $.ajax({
      url : "",
      method : "POST",
      data : {"taskNameFetching" : taskNumber},
      success : function(taskNameFetched) {

        addARowToPending(taskNameFetched, taskNumber);

        // makes sure that todos table is visible
        $(".todos")[0].style.display = "table";
        document.getElementById("headingMakePendingVisible").style.display =
            "none";

        // changes the visibility of completed todos if it's empty
        if ($(".completedtodos")[0].rows.length === 0) {
          $(".completedtodos")[0].style.display = "none";
          document.getElementById("headingMakeCompletedVisible").style.display =
              "table";
        }

      }
    });
  });
};

// clicking Undo changes the status completed to False
$(document).ready(function() { $(".undoCompleteTask").click(undoDone); });

// PURGING ------------------------------------------------------------

var markedAsPurged = function() {
  var row = $(this).parents("tr");
  var taskNumber = row.attr("data-id");

  // makes the change in the database
  $.post("/jquerytodolist/", {"purgeIDnr" : taskNumber});

  // removes the row from completedtodos
  $(".completedtodos").find('[data-id="' + taskNumber + '"]').remove();

  // changes what is displayed in the completed todos section depending on
  // content
  if ($(".completedtodos")[0].rows.length === 0) {
    $(".completedtodos")[0].style.display = "none";
    document.getElementById("headingMakeCompletedVisible").style.display =
        "table";
  }
};

// clicking Purge completely deletes the item from the database
$(document).ready(function() { $(".deleteSubmission").click(markedAsPurged); });
