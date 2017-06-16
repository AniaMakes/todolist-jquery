from django.http import HttpResponse
from django.shortcuts import redirect, render
from django import forms
from django.template import loader
from django.urls import reverse

from .models import Task
from .submit import complete_task, edit_submission, save_submission

def index(request):
    
    todo_list = Task.objects.all()
    waiting_todos = todo_list.filter(completed=False)
    tasks_done = todo_list.filter(completed=True)
    past_search_term = ""
    task_to_be_edited_text = ""
    lastIDinDatabase = ""
    
    for item_name in request.POST:
        item_value = request.POST[item_name]
        complete_prefix = 'complete_task_'
        delete_prefix = "delete_submission_"
        undo_prefix = "undo_complete_"
        edit_prefix = "edit_task_"
        save_prefix = "save_task_"
        cancel_prefix = "cancel_task_"
        
        # printing line to help with diagnostics
        if request.POST != {}:
            print(request.POST)
            print(type(request.POST))

        # function to submit a new task from text-box
        if (item_name.startswith("submit_task")):
            content = (request.POST["submit_task"])
            if content != "":
                if not Task.objects.filter(task_text=content).exists():
                    save_submission(content)        

        # function to mark a task as completed (change Task.completed to True)
        if (item_value.startswith(complete_prefix)):
            task_id_str = item_value[len(complete_prefix):]
            id_to_complete = int(task_id_str)
            print (id_to_complete)
            Task.objects.filter(id=id_to_complete).update(completed = True)

        if (item_value.startswith(delete_prefix)):
            task_id_str = item_value[len(delete_prefix):]
            id_to_delete = int(task_id_str)
            print (id_to_delete)
            Task.objects.filter(id=id_to_delete).delete()

        if (item_value.startswith(undo_prefix)):
            task_id_str = item_value[len(undo_prefix):]
            id_to_undo = int(task_id_str)
            print (id_to_undo)
            Task.objects.filter(id=id_to_undo).update(completed = False)
            
        if (item_name.startswith(save_prefix)):
            task_id_str = item_name[len(save_prefix):]
            id_to_save = int(task_id_str)
            print (id_to_save)
            content = (request.POST['text_field_edit'])
            if content != "":
                Task.objects.filter(id=id_to_save).update(task_text = content)                    


        if (item_name.startswith("search_tasks")):
            content = (request.POST['text_field_search'])
            past_search_term = content
            if content != "":
                print(content)
                print(Task.objects.filter(task_text__icontains=content))
                waiting_todos = todo_list.filter(
                    task_text__icontains=content, completed=False)
                tasks_done = todo_list.filter(
                    task_text__icontains=content, completed=True)

        if (item_name.startswith(edit_prefix)):
            task_id_str = item_name[len(edit_prefix):]
            id_to_undo = int(task_id_str)
            task_to_edit_part1 = Task.objects.filter(id=id_to_undo)[0]
            task_to_be_edited_text = task_to_edit_part1.task_text
    
        if (item_name.startswith("lastIDinDatabase")):
            task_id_nr = waiting_todos.order_by("id").last()
            # print (waiting_todos.order_by("id"))
            print (task_id_nr.id)
            lastIDinDatabase = task_id_nr.id
            print (type(lastIDinDatabase))
            response = HttpResponse(str(lastIDinDatabase))
            return response

    
    context = {
        'waiting_todos': waiting_todos.order_by("id"),
        'tasks_done': tasks_done.order_by("id"),
        # 'past_search_term': past_search_term,
        # 'task_to_be_edited_text': task_to_be_edited_text,
    }    
        
    # print (context)
        
    return render(request, 'jquerytodolist/index.html', context)
