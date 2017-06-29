import json
import pickle
from json import JSONDecoder, JSONEncoder, dumps, loads

from django import forms
from django.core.serializers.json import DjangoJSONEncoder
from django.http import HttpResponse, JsonResponse
from django.shortcuts import redirect, render
from django.template import loader
from django.urls import reverse

from .models import Task
from .submit import complete_task, edit_submission, save_submission


def index(request):

    todo_list = Task.objects.all()
    waiting_todos = todo_list.filter(completed=False)
    tasks_done = todo_list.filter(completed=True)
    print(tasks_done)
    past_search_term = ""
    task_to_be_edited_text = ""
    lastIDinDatabase = ""
    
    
    
    
    # printing line to help with diagnostics
    if request.POST != {}:
        print(request.POST)
        print(type(request.POST))
        call_aim = request.POST["aim"]

    
        # DATA FETCHING FUNCTIONS
        # id fetching for creating a new task
        if (call_aim.startswith("idFetching")):
            task_id_nr = waiting_todos.order_by("id").last()
            # print (waiting_todos.order_by("id"))
            print(task_id_nr.id)
            lastIDinDatabase = task_id_nr.id
            print(type(lastIDinDatabase))
            response = HttpResponse(str(lastIDinDatabase))
            return response
            
        # when moving task from pending to completed, this function looks for task_text itself
        # changed to work with reference in tr only
        if (call_aim.startswith("nameFetching")):
            task_id_str = request.POST["taskNameFetching"]
            print (task_id_str)
            id_to_complete = int(task_id_str)
            task_text = Task.objects.filter(id=id_to_complete)[0]
            response = HttpResponse(task_text)
            return response        
            
        
        # ADDING TASKS
        # function to submit a new task from text-box
        if (call_aim.startswith("adding")):
            content = (request.POST["submit_task"])
            if content != "":
                if not Task.objects.filter(task_text=content).exists():
                    save_submission(content)    
        
        # SEARCHING 
        if (call_aim.startswith("searching")):
            content = (request.POST['search_tasks'])
            past_search_term = content
            if content != "":
                print(content)
                print(Task.objects.filter(task_text__icontains=content))
                print (1)
                waiting_todos = todo_list.filter(
                    task_text__icontains=content, completed=False)
                tasks_done = todo_list.filter(
                    task_text__icontains=content, completed=True)
                print (2)   
                
                output_list=[]
                for task in waiting_todos:
                    dict_of_task = {"id": task.id, "task_text": task.task_text , "completed" : task.completed}
                    output_list.append(dict_of_task)
                
                for task in tasks_done:
                    dict_of_task = {"id": task.id, "task_text": task.task_text , "completed" : task.completed}
                    output_list.append(dict_of_task)
                
                print (output_list)
                
                json_data = json.dumps(output_list)
                
                print (json_data)
                # myJSON = JSON.stringify(output_list);
                # 
                # print (myJSON)
                
                return JsonResponse(output_list, safe=False)
        
        # EDITING
        if (call_aim.startswith("updatedText")):
            task_id_str = request.POST["taskID"]
            id_to_save = int(task_id_str)
            print(id_to_save)
            content = (request.POST['updatedText'])
            if content != "":
                Task.objects.filter(id=id_to_save).update(task_text=content)
        
        # MARKING TASKS AS COMPLETED
        # function to mark a task as completed (change Task.completed to True)
        # changed to work with reference in tr only
        if (call_aim.startswith("completing")):
            task_id_str = request.POST["completeIDnr"]
            id_to_complete = int(task_id_str)
            Task.objects.filter(id=id_to_complete).update(completed=True)
        
        # UNDOING
        # changed to work with reference in tr only
        if (call_aim.startswith("undoing")):
            task_id_str = request.POST["undocompleteIDnr"]
            id_to_undo = int(task_id_str)
            print(id_to_undo)
            Task.objects.filter(id=id_to_undo).update(completed=False)
        
        # PURGING
        # function to purge items that are in the Completed list
        if (call_aim.startswith("purging")):
            task_id_str = request.POST["purgeIDnr"]
            id_to_delete = int(task_id_str)
            print(id_to_delete)
            Task.objects.filter(id=id_to_delete).delete()
            
            
# ================================================================

    context = {
        'waiting_todos': waiting_todos.order_by("id"),
        'tasks_done': tasks_done.order_by("id"),
        # 'past_search_term': past_search_term,
        # 'task_to_be_edited_text': task_to_be_edited_text,
    }

    # print (context)

    return render(request, 'jquerytodolist/index.html', context)
