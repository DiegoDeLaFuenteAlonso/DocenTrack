import os
import django
from typing import cast

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'docentrack.settings')
django.setup()

from django.test import Client
from django.http import HttpResponse
from django.contrib.auth.models import User

user, created = User.objects.get_or_create(username='admin', is_superuser=True, is_staff=True)
if created:
    user.set_password('admin')
    user.save()

client = Client()
client.force_login(user)

response = cast(HttpResponse, client.get('/admin/evaluations/userprofile/'))
print('PROFILE LIST STATUS:', response.status_code)
if response.status_code >= 400:
    print(response.content.decode('utf-8'))

response = cast(HttpResponse, client.get('/admin/auth/user/add/'))
print('USER ADD STATUS:', response.status_code)
if response.status_code >= 400:
    print(response.content.decode('utf-8'))
