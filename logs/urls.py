from django.urls import path
from . import views

urlpatterns = [
    path("", views.dashboard, name="dashboard"),

    path("api/email/", views.email_api, name="email_api"),
    path("api/sms/", views.sms_api, name="sms_api"),
    path("api/whatsapp/", views.whatsapp_api, name="whatsapp_api"),

    path("api/stats/", views.stats_api, name="stats_api"),
    path("api/delete/", views.delete_api, name="delete_api"),
]