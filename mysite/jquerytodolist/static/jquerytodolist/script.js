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

            var $item =
                $("<tr id='task" + lastIDinDatabaseReturn + "'><td>" + toAdd +
                  "</td><td><div class= completeTask id='completeTask" +
                  lastIDinDatabaseReturn + " ' name=complete_task_" +
                  lastIDinDatabaseReturn + "> &#10004;</div>" +
                  "</td>" +
                  "<td>" +
                  "<div class=editTask id='editTask" + lastIDinDatabaseReturn +
                  " ' name=edit_task_" + lastIDinDatabaseReturn +
                  ">&#10000;</div>" +
                  "</td>" +
                  "</tr>");
            $(".todos").append($item);
            $("#addTaskBox").val("");

            // this is the line that means that the button works straight away.
            // Because a new button of class completeTask was added, it needs to
            // be made active using the code below, which finds all
            // .completeTask (including the new one), and assigns them "when
            // clicked" action
            $item.find('.completeTask').click(markAsDoneAction);
          }
        });
      });
    }
  });
});


// MARKING TASKS AS COMPLETED ---------------------------------------

var markAsDoneAction =
    function() {
  var completeID = $(this).attr("name");
  var completeTask = "task";
  var prefix_len = complete_prefix.length;
  var toComplete = completeID.substring(
      prefix_len,);
  var idToComplete = completeTask.concat(toComplete);

  console.log(this, completeID, prefix_len, toComplete, idToComplete);

  $(".completedtodos #" + idToComplete).append();
  // $(".completedtodos #" + idToComplete).remove();
  $(".completedtodos").find('#' + idToComplete).remove(); // works

  $.post("/jquerytodolist/", {"completeIDnr" : completeID}).done(function() {
    $.ajax({
      url : "",
      method : "POST",
      data : {"taskNameFetching" : completeID},
      success : function(taskNameFetched) {
        //   document.getElementById("makeCompletedVisible").style.display =
        //   "block";
        //   document.getElementById("headingMakeCompletedVisible").style.display
        //   = "none";
        
        
        // id to complete gives task###
        var $item = $(
            "<tr data-id=" + toComplete + " >" +
            "<td>" +
            "<div class=deleteSubmission id='deleteSubmission" + toComplete +
            " ' name=delete_submission_" + toComplete + ">purge</div>" +
            "</td>" +
            "<td>" +
            "<div class= undoCompleteTask id='undo_complete_" + toComplete +
            "' name=undo_complete_" + toComplete + ">undo</div>" +
            "</td>" +
            '<td>' + taskNameFetched + '</td>');

        $(".completedtodos").append($item);

        console.log($(".todos").find('#' + idToComplete));

        $(".todos").find('#' + idToComplete).remove();

        // I have added deleteSubmission and undoComplete, so we need functions
        // to make those buttons functional immediately
        $item.find('.undoCompleteTask').click(undoDone);
        $item.find('.deleteSubmission').click(markedAsPurged);
      }
    });
  });
};

    // clicking Done changes status completed to True
    $(document)
        .ready(function() { $(".completeTask").click(markAsDoneAction); });

// UNDOING -----------------------------------------------------------

var undoDone = function() {
  var undoCompleteID = $(this).attr("name");
  var completeTask = "task";
  var prefix_len = complete_prefix.length;
  var toComplete = undoCompleteID.substring(
      prefix_len,
  );
  var idToComplete = completeTask.concat(toComplete);
  console.log(undoCompleteID, prefix_len, toComplete, idToComplete);
  $(".todos #" + idToComplete).append();
  // $(".completedtodos #" + idToComplete).remove();
  $(".completedtodos").find('#' + idToComplete).remove(); // works
  $.post("/jquerytodolist/", {"undocompleteIDnr" : undoCompleteID});

  // make ajax request to fetch the conent of the name part
  $.post("/jquerytodolist/", {"completeIDnr" : undoCompleteID}).done(function() {
    $.ajax({
      url : "",
      method : "POST",
      data : {"taskNameFetching" : undoCompleteID},
      success : function(taskNameFetched) {
        // this needs to build a row for the table and update buttons created
        // and delete the current rown in the completed tasks table

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
        $("#addTaskBox").val("");

        // updates buttons
        $item.find('.completeTask').click(markAsDoneAction);

        // delete row from completed
        $(".completedtodos").find('[data-id="' + toComplete + '"]').remove();

      }
  });
});
};

// clicking Undo changes the status completed to False
$(document).ready(function() { $(".undoCompleteTask").click(undoDone); });

// PURGING ------------------------------------------------------------

var markedAsPurged =
    function() {
  var deleteSubmissionID = $(this).attr("name");

  //$(this).parents('.task').attr('id')

  var completeTask = "task";
  var prefix_len = delete_prefix.length;
  var toComplete = deleteSubmissionID.substring(
      prefix_len,
  );
  var idToComplete = completeTask.concat(toComplete);
  console.log(deleteSubmissionID, prefix_len, toComplete, idToComplete);
  console.log($(".completedtodos").find('[data-id="' + toComplete + '"]'));
  $(".completedtodos").find('[data-id="' + toComplete + '"]').remove();
  // $(".completedtodos #" + idToComplete).remove();
  $.post("/jquerytodolist/", {"undocompleteIDnr" : deleteSubmissionID});

};

// clicking Purge completely deletes the item from the database
$(document)
    .ready(function() { $(".deleteSubmission").click(markedAsPurged); });
