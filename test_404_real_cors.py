import urllib.request, urllib.error
req = urllib.request.Request('https://docentrack.onrender.com/api/token/', method='OPTIONS', headers={'Origin': 'https://docentrack-web.onrender.com', 'Access-Control-Request-Method': 'POST'})
try:
  res = urllib.request.urlopen(req)
  print(res.status, dict(res.headers))
except urllib.error.HTTPError as e:
  print(e.code)
  print(e.headers.items())
