from .models import Task
from django.utils import timezone

def save_submission(tt):
    t = Task(task_text=tt, creation_date=timezone.now())
    print (t)
    t.save()

def edit_submission(id, et):
    t = Task(id = id, task_text=et)
    print (t)
    t.save()    
    
def complete_task(id):
    t = Task(id = id)
    t.update(completed = True)