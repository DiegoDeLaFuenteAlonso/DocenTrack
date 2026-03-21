import os
import django
import re

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'docentrack.settings')
django.setup()

from django.test import Client
from django.contrib.auth.models import User

user, created = User.objects.get_or_create(username='admin', is_superuser=True, is_staff=True)
if created:
    user.set_password('admin')
    user.save()

client = Client()
client.force_login(user)

def check_url(url):
    response = client.get(url)
    print(f'STATUS FOR {url}:', response.status_code)
    if response.status_code == 500:
        content = response.content.decode('utf-8')
        title_match = re.search(r'<title>(.*?)</title>', content)
        if title_match:
            print("TITLE:", title_match.group(1))
        exc_match = re.search(r'<pre class="exception_value">(.*?)</pre>', content, re.DOTALL)
        if exc_match:
            print("EXCEPTION VALUE:", exc_match.group(1).strip())
        tb_match = re.search(r'<div class="commands">.*?<a href="#" onclick="return varToggle\(this, \'(.*?)\'\)">', content, re.DOTALL)
        print("Done check.")

check_url('/admin/evaluations/userprofile/')
check_url('/admin/auth/user/add/')
