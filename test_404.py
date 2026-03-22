import urllib.request, urllib.error
try:
  res = urllib.request.urlopen("https://docentrack-api.onrender.com/api/token/")
  print(res.read().decode())
except urllib.error.HTTPError as e:
  print(e.code)
  print(e.read().decode())
