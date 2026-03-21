import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'docentrack.settings')
django.setup()

from django.test import Client
from django.contrib.auth.models import User
import traceback
from bs4 import BeautifulSoup

user, created = User.objects.get_or_create(username='admin', is_superuser=True, is_staff=True)
if created:
    user.set_password('admin')
    user.save()

client = Client(raise_request_exception=False)
client.force_login(user)

try:
    response = client.get('/admin/evaluations/userprofile/')
    print('PROFILE LIST STATUS:', response.status_code)
    if response.status_code == 500:
        soup = BeautifulSoup(response.content, 'html.parser')
        print("EXCEPTION:", soup.title.string if soup.title else "No title")
        exception_value = soup.find('pre', {'class': 'exception_value'})
        if exception_value:
            print("VALUE:", exception_value.text)
except Exception as e:
    print("FATAL ERROR ON PROFILE URL:")
    traceback.print_exc()

try:
    response = client.get('/admin/auth/user/add/')
    print('USER ADD STATUS:', response.status_code)
    if response.status_code == 500:
        soup = BeautifulSoup(response.content, 'html.parser')
        print("EXCEPTION:", soup.title.string if soup.title else "No title")
        exception_value = soup.find('pre', {'class': 'exception_value'})
        if exception_value:
            print("VALUE:", exception_value.text)
except Exception as e:
    print("FATAL ERROR ON USER URL:")
    traceback.print_exc()

