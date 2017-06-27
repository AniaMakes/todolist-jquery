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

// FUNCTION TO CREATE A ROW IN HTML BY FETCHING & CLONING TEMPLATE FROM HTML

function addARowToPending(text, taskNumber) {
  // use jquery to fetch template from HTML
  var $row = $(".templatePendingTask");
  // clone the template
  $editableCopy = $row.clone();
  // use the clone and add number to the tr
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

              // in index.http have two invisible tables - one for pending, the
              // other for completed. The code will go through the objects that
              // have been returned and place them in both tables. They will
              // also remain in the original tables. If a task is completed /
              // purged / undone, the code will change the line among two search
              // tables AND the pending / completed tables.

              // if there is at least one matching result
              if (searchResult.length !== 0) {
                // for each result
                for (i = 0; i < searchResult.length; i++) {
                  console.log(searchResult[i]);
                  // if its completed status is false
                  if (!searchResult[i].completed) {
                    console.log("It's all true");
                    $(".search_pending_todos")[0].style.display = "table";
                    console.log(i);

                    var taskID = searchResult[i].id;
                    console.log(taskID);
                    var $item =
                        $("<tr id='task" + taskID + "'><td>" +
                          searchResult[i].task_text +
                          "</td><td><div class= completeTask id='completeTask" +
                          taskID + " ' name=complete_task_" + taskID +
                          "> &#10004;</div>" +
                          "</td>" +
                          "<td>" +
                          "<div class=editTask id='editTask" + taskID +
                          " ' name=edit_task_" + taskID + ">&#10000;</div>" +
                          "</td>" +
                          "</tr>");
                    $(".search_pending_todos").append($item);
                    $("#addTaskBox").val("");

                    $item.find('.completeTask').click(markAsDoneAction);

                  }
                  // if its completed status is true

                  else {
                    console.log("boo");
                    $(".search_completed_todos")[0].style.display = "table";
                    console.log(i);

                    var taskID2 = searchResult[i].id;
                    console.log(taskID2);
                    var $item2 =
                        $("<tr data-id=" + taskID2 + " >" +
                          "<td>" +
                          "<div class=deleteSubmission id='deleteSubmission" +
                          taskID2 + " ' name=delete_submission_" + taskID2 +
                          ">purge</div>" +
                          "</td>" +
                          "<td>" +
                          "<div class= undoCompleteTask id='undo_complete_" +
                          taskID2 + "' name=undo_complete_" + taskID2 +
                          ">undo</div>" +
                          "</td>" +
                          '<td>' + searchResult[i].task_text + '</td></tr>');
                    $(".search_completed_todos").append($item2);
                    $("#addTaskBox").val("");

                    $item2.find('.markedAsPurged').click(markAsDoneAction);
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

        // marking item as complete shoud:
        // 1. move the item to  completedtodos
        // $(".completedtodos").append($item);
        // 2. move the item to search_completed_todos

        // $(".search_completed_todos").append($item.clone());
        //
        // // $(".search_completed_todos")[0].style.display = "table";
        //
        // console.log($(".todos").find('#' + idToComplete));
        //
        // $(".todos").find('#' + idToComplete).remove();
        // $(".search_pending_todos").find('#' + idToComplete).remove();
        //
        // // I have added deleteSubmission and undoComplete, so we need
        // // functions to make those buttons functional immediately
        // $item.find('.undoCompleteTask').click(undoDone);
        // $item.find('.deleteSubmission').click(markedAsPurged);
        //
        // $item.clone().find('.undoCompleteTask').click(undoDone);
        // $item.clone().find('.deleteSubmission').click(markedAsPurged);

        // if ($(".search_pending_todos")[0].rows.length === 0) {
        //   $(".search_pending_todos")[0].style.display = "none";
        //
        // //   if ($(".todos")[0].rows.length === 0) {
        // //     $(".todos")[0].style.display = "none";
        // //
        // document.getElementById("headingMakePendingVisible").style.display =
        // //         "table";
        // //   }
        // }
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

  // $(".todos #" + idToComplete).append();
  // $(".completedtodos #" + idToComplete).remove();
  $(".completedtodos").find('[data-id="' + taskNumber + '"]').remove(); // works

  $.post("/jquerytodolist/", {"undocompleteIDnr" : taskNumber});

  // make ajax request to fetch the conent of the name part
  $.post("/jquerytodolist/", {"completeIDnr" : taskNumber}).done(function() {
    $.ajax({
      url : "",
      method : "POST",
      data : {"taskNameFetching" : taskNumber},
      success : function(taskNameFetched) {

        // this needs to build a row for the table and update buttons
        // created and delete the current rown in the completed tasks table

        // creates row in pending (duplicate of code in creating a brand new
        // task)
        addARowToPending(taskNameFetched, taskNumber);

        // the line below is needed for search
        // $(".search_pending_todo").append($item.clone());

        $(".todos")[0].style.display = "table";
        document.getElementById("headingMakePendingVisible").style.display =
            "none";

        $("#addTaskBox").val("");

        // updates buttons
        // $item.find('.completeTask').click(markAsDoneAction);

        // delete row from completed
        $(".completedtodos").find('[data-id="' + taskNumber + '"]').remove();
        $(".search_completed_todos")
            .find('[data-id="' + taskNumber + '"]')
            .remove();

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

  $(".completedtodos").find('[data-id="' + taskNumber + '"]').remove();
  $(".search_completed_todos").find('[data-id="' + taskNumber + '"]').remove();
  // $(".completedtodos #" + idToComplete).remove();
  $.post("/jquerytodolist/", {"purgeIDnr" : taskNumber});

  if ($(".search_completed_todos")[0].rows.length === 0) {
    $(".search_completed_todos")[0].style.display = "none";
  }

  if ($(".completedtodos")[0].rows.length === 0) {
    $(".completedtodos")[0].style.display = "none";
    document.getElementById("headingMakeCompletedVisible").style.display =
        "table";
  }
};

// clicking Purge completely deletes the item from the database
$(document).ready(function() { $(".deleteSubmission").click(markedAsPurged); });
