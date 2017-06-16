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
             alert(lastIDinDatabaseReturn);
             $(".todos").append(
                 "<tr id><td>" + toAdd +
                 "</td><td><div class= completeTask id='completeTask" + lastIDinDatabaseReturn +  " ' name=complete_task_" + lastIDinDatabaseReturn + "> &#10004;</div>" +
                 "</td>" +
                 "<td>" +
                 "<div class=editTask id='editTask" + lastIDinDatabaseReturn + " ' name=edit_task_" + lastIDinDatabaseReturn + ">&#10000;</div>" +
                 "</td>" +
                 "</tr>");
             $("#addTaskBox").val("");
           }
        });
      });
      
    }
  });
});

//
//   $ajax({
//      url: "index.html", data: "lastIDinDatabase", method: POST, success
//      : function(answer){
//          //replace {{task.id}} with answer
//      }
//   });

// prints out a list of waiting todos
$(document).ready(function() { $(".todos").append(past_waiting_todos); });

// prints out a list of done todos
//$(document).ready(function() {
//$(".completedtodos").append(past_tasks_done); });

// clicking Done changes status completed to True
$(document).ready(function() {
  $(".completeTask").click(function() {
    var completeID = $(this).attr("name");
    var completeTask = "task";
    var prefix_len = complete_prefix.length;
    var toComplete = completeID.substring(
        prefix_len,
    );
    var idToComplete = completeTask.concat(toComplete);
    console.log(this, completeID, prefix_len, toComplete, idToComplete);
    $.post("/jquerytodolist/", {"completeIDnr" : completeID});
    $(".completedtodos")
        .append(
            "<tr id=task{{task.id}} >" +
            "<td>" +
            "<div class=deleteSubmission id='deleteSubmission{{task.id}}' name=delete_submission_{{task.id}}>purge</div>" +
            "</td>" +
            "<td>" +
            "<div class= undoCompleteTask id='undo_complete_{{task.id}}' name=undo_complete_{{task.id}}>undo</div>" +
            "</td>" +
            '<td>' + (idToComplete) + '</td>');
    $(".todos #" + idToComplete).remove();

  });
});

// clicking Undo changes the status completed to False
$(document).ready(function() {
  $(".undoCompleteTask").click(function() {
    var undoCompleteID = $(this).attr("name");
    var completeTask = "task";
    var prefix_len = complete_prefix.length;
    var toComplete = undoCompleteID.substring(
        prefix_len,
    );
    var idToComplete = completeTask.concat(toComplete);
    console.log(undoCompleteID, prefix_len, toComplete, idToComplete);
    $(".todos #" + idToComplete).append();
    $(".completedtodos #" + idToComplete).remove();
    $.post("/jquerytodolist/", {"undocompleteIDnr" : undoCompleteID});
  });
});

// clicking Purge completely deletes the item from the database
$(document).ready(function() {
  $(".deleteSubmission").click(function() {
    var deleteSubmissionID = $(this).attr("name");
    var completeTask = "task";
    var prefix_len = delete_prefix.length;
    var toComplete = deleteSubmissionID.substring(
        prefix_len,
    );
    var idToComplete = completeTask.concat(toComplete);
    console.log(deleteSubmissionID, prefix_len, toComplete, idToComplete);
    $(".completedtodos #" + idToComplete).remove();
    $.post("/jquerytodolist/", {"undocompleteIDnr" : deleteSubmissionID});
  });
});
