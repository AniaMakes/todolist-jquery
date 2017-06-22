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

                // var $newTask = $('#task-template').clone();
                //$newTask.id (?? not sure how to set the id) = 'task' +
                // lastIDinDatabaseReturn;
                // also set task text

                //$(".todos").append($newTask);

                var $item = $(
                    "<tr id='task" + lastIDinDatabaseReturn + "'><td>" + toAdd +
                    "</td><td><div class= completeTask id='completeTask" +
                    lastIDinDatabaseReturn + " ' name=complete_task_" +
                    lastIDinDatabaseReturn + "> &#10004;</div>" +
                    "</td>" +
                    "<td>" +
                    "<div class=editTask id='editTask" +
                    lastIDinDatabaseReturn + " ' name=edit_task_" +
                    lastIDinDatabaseReturn + ">&#10000;</div>" +
                    "</td>" +
                    "</tr>");
                $(".todos").append($item);
                $("#addTaskBox").val("");

                // this is the line that means that the button works straight
                // away. Because a new button of class completeTask was added,
                // it needs to be made active using the code below, which finds
                // all .completeTask (including the new one), and assigns them
                // "when clicked" action
                $item.find('.completeTask').click(markAsDoneAction);
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
              "Your item has not been searched for. YOU, however, have been added to the Santa's naughty list");}

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
                    $(".search_pending_todos")[0].style.display = "block";
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
                    $(".search_completed_todos")[0].style.display = "block";
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
                $(".noMatchingTasks")[0].style.display = "block";
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
  var completeID = $(this).attr("name");
  var completeTask = "task";
  var prefix_len = complete_prefix.length;
  var toComplete = completeID.substring(prefix_len);
  var idToComplete = completeTask.concat(toComplete);

  console.log(this, completeID, prefix_len, toComplete, idToComplete);

  $(".completedtodos #" + idToComplete).append();
  $(".completedtodos").find('#' + idToComplete).remove(); // works

  $.post("/jquerytodolist/", {"completeIDnr" : completeID}).done(function() {
    $.ajax({
      url : "",
      method : "POST",
      data : {"taskNameFetching" : completeID},
      success : function(taskNameFetched) {
        $(".completedtodos")[0].style.display = "block";
        document.getElementById("headingMakeCompletedVisible").style.display =
            "none";

        // tocomplete gives task ###
        var $item =
            $("<tr data-id=" + toComplete + " >" +
              "<td>" +
              "<div class=deleteSubmission id='deleteSubmission" + toComplete +
              " ' name=delete_submission_" + toComplete + ">purge</div>" +
              "</td>" +
              "<td>" +
              "<div class= undoCompleteTask id='undo_complete_" + toComplete +
              "' name=undo_complete_" + toComplete + ">undo</div>" +
              "</td>" +
              '<td>' + taskNameFetched + '</td></tr>');

        // marking item as complete shoud:
        // 1. move the item to  completedtodos
        $(".completedtodos").append($item);
        // 2. move the item to search_completed_todos

        $(".search_completed_todos").append($item.clone());

        // $(".search_completed_todos")[0].style.display = "block";

        console.log($(".todos").find('#' + idToComplete));

        $(".todos").find('#' + idToComplete).remove();
        $(".search_pending_todos").find('#' + idToComplete).remove();

        if ($(".search_pending_todos")[0].rows.length === 0) {
          $(".search_pending_todos")[0].style.display = "none";

          // I have added deleteSubmission and undoComplete, so we need
          // functions to make those buttons functional immediately
          $item.find('.undoCompleteTask').click(undoDone);
          $item.find('.deleteSubmission').click(markedAsPurged);

          $item.clone().find('.undoCompleteTask').click(undoDone);
          $item.clone().find('.deleteSubmission').click(markedAsPurged);
        }
      }
    });
  });
};

// clicking Done changes status completed to True
$(document).ready(function() { $(".completeTask").click(markAsDoneAction); });

// UNDOING -----------------------------------------------------------

var undoDone = function() {
  var undoCompleteID = $(this).attr("name");
  var completeTask = "task";
  var prefix_len = complete_prefix.length;
  var toComplete = undoCompleteID.substring(prefix_len);
  var idToComplete = completeTask.concat(toComplete);
  console.log(undoCompleteID, prefix_len, toComplete, idToComplete);
  $(".todos #" + idToComplete).append();
  // $(".completedtodos #" + idToComplete).remove();
  $(".completedtodos").find('#' + idToComplete).remove(); // works
  $.post("/jquerytodolist/", {"undocompleteIDnr" : undoCompleteID});

  // make ajax request to fetch the conent of the name part
  $.post("/jquerytodolist/", {
     "completeIDnr" : undoCompleteID
   }).done(function() {
    $.ajax({
      url : "",
      method : "POST",
      data : {"taskNameFetching" : undoCompleteID},
      success : function(taskNameFetched) {
        // this needs to build a row for the table and update buttons
        // created and delete the current rown in the completed tasks table

        // creates row in pending (duplicate of code in creating a brand new
        // task)
        var $item = $("<tr id='task" + toComplete + "'><td>" + taskNameFetched +
                      "</td><td><div class= completeTask id='completeTask" +
                      toComplete + " ' name=complete_task_" + toComplete +
                      "> &#10004;</div>" +
                      "</td>" +
                      "<td>" +
                      "<div class=editTask id='editTask" + toComplete +
                      " ' name=edit_task_" + toComplete + ">&#10000;</div>" +
                      "</td>" +
                      "</tr>");
        $(".todos").append($item);
        $(".search_pending_todo").append($item.clone());

        $("#addTaskBox").val("");

        // updates buttons
        $item.find('.completeTask').click(markAsDoneAction);

        // delete row from completed
        $(".completedtodos").find('[data-id="' + toComplete + '"]').remove();
        $(".search_completed_todos")
            .find('[data-id="' + toComplete + '"]')
            .remove();

        if ($(".completedtodos")[0].rows.length === 0) {
          $(".completedtodos")[0].style.display = "none";
          document.getElementById("headingMakeCompletedVisible").style.display =
              "block";
        }

      }
    });
  });
};

// clicking Undo changes the status completed to False
$(document).ready(function() { $(".undoCompleteTask").click(undoDone); });

// PURGING ------------------------------------------------------------

var markedAsPurged = function() {
  var deleteSubmissionID = $(this).attr("name");

  //$(this).parents('.task').attr('id')

  var completeTask = "task";
  var prefix_len = delete_prefix.length;
  var toComplete = deleteSubmissionID.substring(prefix_len);
  var idToComplete = completeTask.concat(toComplete);
  console.log(deleteSubmissionID, prefix_len, toComplete, idToComplete);
  console.log($(".completedtodos").find('[data-id="' + toComplete + '"]'));

  $(".completedtodos").find('[data-id="' + toComplete + '"]').remove();
  $(".search_completed_todos").find('[data-id="' + toComplete + '"]').remove();
  // $(".completedtodos #" + idToComplete).remove();
  $.post("/jquerytodolist/", {"undocompleteIDnr" : deleteSubmissionID});

  if ($(".search_completed_todos")[0].rows.length === 0) {
    $(".search_completed_todos")[0].style.display = "none";
  }

  if ($(".completedtodos")[0].rows.length === 0) {
    $(".completedtodos")[0].style.display = "none";
    document.getElementById("headingMakeCompletedVisible").style.display =
        "block";
  }
};

// clicking Purge completely deletes the item from the database
$(document).ready(function() { $(".deleteSubmission").click(markedAsPurged); });
