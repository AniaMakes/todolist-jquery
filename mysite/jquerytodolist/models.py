from django.db import models

class Task(models.Model):
    LOW = 'LO'
    STANDARD = 'ST'
    HIGH = 'HI'
    
    
    IMPORTANCE_OF_TASK = (
        (LOW, 'low'),
        (STANDARD, 'standard'),
        (HIGH, 'high'),
    )
    task_text = models.CharField(max_length=200)
    task_importance = models.CharField(max_length=10, choices=IMPORTANCE_OF_TASK, default=STANDARD)
    creation_date = models.DateField('date added')
    completed=models.BooleanField(default=False)
    
    def __str__(self):
        return self.task_text