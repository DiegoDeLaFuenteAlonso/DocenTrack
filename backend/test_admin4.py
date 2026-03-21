import sys
import os
import django
import traceback

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'docentrack.settings')
django.setup()

from django.test import Client
from django.contrib.auth.models import User

user, created = User.objects.get_or_create(username='admin', is_superuser=True, is_staff=True)
if created:
    user.set_password('admin')
    user.save()

client = Client(raise_request_exception=True)
client.force_login(user)

try:
    print('Testing /admin/evaluations/userprofile/')
    response = client.get('/admin/evaluations/userprofile/')
    print('STATUS:', response.status_code)
except Exception as e:
    traceback.print_exc()

try:
    print('Testing /admin/auth/user/add/')
    response = client.get('/admin/auth/user/add/')
    print('STATUS:', response.status_code)
except Exception as e:
    traceback.print_exc()

