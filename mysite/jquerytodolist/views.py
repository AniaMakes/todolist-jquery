from django.http import HttpResponse
from django.shortcuts import redirect, render

from .models import Task
from .submit import complete_task, edit_submission, save_submission

def index(request):
    
    todo_list = Task.objects.all()
    waiting_todos = todo_list.filter(completed=False)
    tasks_done = todo_list.filter(completed=True)
    past_search_term = ""
    task_to_be_edited_text = ""
    
    if request.POST != {}:
        print(request.POST)
        print(type(request.POST))
        print (type(request.POST["task_text"]))
    
        content = (request.POST["task_text"])
        if content != "":
            if not Task.objects.filter(task_text=content).exists():
                save_submission(content)    
    
    
    context = {
        'waiting_todos': waiting_todos.order_by("id"),
        # 'tasks_done': tasks_done.order_by("id"),
        # 'past_search_term': past_search_term,
        # 'task_to_be_edited_text': task_to_be_edited_text,
    }    
        
    return render(request, 'jquerytodolist/index.html', context)
