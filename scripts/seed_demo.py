"""Create a demo account and sample leads through the real API (standard library only).
Run: python scripts/seed_demo.py --url http://localhost:8080
The password is entered privately and is never stored in source control.
"""
import argparse, getpass, json, urllib.request, urllib.parse, http.cookiejar
from datetime import date, timedelta
parser = argparse.ArgumentParser()
parser.add_argument('--url', default='http://localhost:8080')
parser.add_argument('--email', default='demo@example.com')
args = parser.parse_args()
password = getpass.getpass('Choose demo password (10–64 characters, max 72 UTF-8 bytes): ')
if not 10 <= len(password) <= 64 or len(password.encode()) > 72:
    raise SystemExit('Password does not meet the requirements.')
base = args.url.rstrip('/')
if not base.startswith(('https://', 'http://localhost:', 'http://127.0.0.1:')):
    raise SystemExit('Use HTTPS for remote deployments.')
client = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
def request(path, body=None, form=False):
    headers = {}
    if body is not None:
        token = request('/auth/csrf')
        headers[token['headerName']] = token['token']
        headers['Content-Type'] = 'application/x-www-form-urlencoded' if form else 'application/json'
        body = (urllib.parse.urlencode(body) if form else json.dumps(body)).encode()
    with client.open(urllib.request.Request(base + '/api' + path, data=body, headers=headers)) as response:
        return json.loads(response.read()) if response.status != 204 else None
try:
    request('/auth/register', {'name': 'Demo User', 'email': args.email, 'password': password})
    request('/auth/login', {'email': args.email, 'password': password}, form=True)
    names = [('Aarav Sharma','Northstar Studio'),('Diya Rao','Bloom Retail'),('Kabir Mehta','Atlas Software'),('Ananya Iyer','Cedar Labs'),('Rohan Patel','Orbit Media'),('Meera Nair','Fern Health'),('Arjun Reddy','Pixel Works'),('Isha Gupta','Lumen Design'),('Dev Shah','Harbor Tech'),('Sara Khan','Maple Foods'),('Nikhil Das','Bright Learning'),('Tara Sen','Evergreen Travel')]
    statuses = ['NEW','CONTACTED','QUALIFIED','CONVERTED','LOST']
    services = ['Web Development','SEO','Social Media Marketing','Paid Advertising','UI/UX Design']
    for i,(name,company) in enumerate(names):
        request('/leads', {'name':name,'email':f'contact{i+1}@example.com','phone':f'+91 90000 {10000+i}', 'company':company,'service':services[i%5], 'status':statuses[i%5], 'followUpDate':str(date.today()+timedelta(days=i-2)), 'notes':'Fictional demo lead. Confirm requirements and agree on the next step.'})
    request('/auth/logout', {})
    print('Created 12 fictional leads. Sign in with', args.email, 'and the password you chose.')
except urllib.error.HTTPError as error:
    print('API error:', error.code, error.read().decode())
    raise SystemExit(1)
