from django.db import models

class EmailLog(models.Model):
    email_to = models.EmailField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.email_to


class SmsLog(models.Model):
    mobile_number = models.CharField(max_length=30)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.mobile_number


class WhatsappLog(models.Model):
    mobile_number = models.CharField(max_length=30)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.mobile_number